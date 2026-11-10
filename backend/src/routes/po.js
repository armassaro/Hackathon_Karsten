// Geração da Ficha PO: pré-visualização, importação de arquivos, exportação e envio por e-mail.
import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { exigir } from '../auth/middleware.js';
import { calcularPO, ErroValidacao } from '../core/motorTM.js';
import { lerDemandas, montarDemanda } from '../ingest/demanda.js';
import { gerarXlsx } from '../export/fichaPO.js';
import { obterCatalogo } from '../store/index.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 50 } });
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const limiteEmail = rateLimit({
  windowMs: 60 * 60_000,
  limit: 20,
  keyGenerator: (req) => req.user.email,
  message: { erro: 'Limite de 20 envios por hora atingido.' },
});

/** Aceita demanda em formato canônico OU com os rótulos da planilha ("Pontos/cm", "Cód. Eqp"...). */
const normalizar = (obj) => montarDemanda(Object.entries(obj ?? {}));

/** Calcula várias demandas sem interromper o lote quando uma delas falha. */
function processar(demandas, catalogo) {
  return demandas.map((demanda) => {
    try {
      return { demanda, po: calcularPO(demanda, catalogo) };
    } catch (e) {
      if (e instanceof ErroValidacao) return { demanda, erros: e.erros };
      throw e;
    }
  });
}

function nomeArquivo(pos) {
  const base = pos.length === 1 ? pos[0].cabecalho.titulo || 'PO' : `POs-lote-${pos.length}`;
  return `${base.replace(/[^\w.-]+/g, '_')}.xlsx`;
}

function exigirPOs(resultados) {
  const falhas = resultados.filter((r) => r.erros);
  if (falhas.length) {
    throw new ErroValidacao(falhas.flatMap((f) => f.erros.map((e) => `${f.demanda.titulo || f.demanda.origem || 'PO'}: ${e}`)));
  }
  return resultados.map((r) => r.po);
}

export function rotasPO(store) {
  const r = Router();
  const engenheiro = exigir('engenheiro', store);
  const log = (req, acao, det) => store.registrarLog(req.user.email, acao, det).catch(() => {});

  // Calcula e devolve a PO em JSON para exibir na tela.
  r.post('/preview', engenheiro, async (req, res) => {
    const po = calcularPO(normalizar(req.body), await obterCatalogo(store));
    res.json(po);
  });

  // Upload de 1..50 arquivos (txt, json, csv, xlsx, ods). Cada arquivo pode ter várias demandas.
  // ?saida=xlsx devolve direto a planilha (útil para scripts com token de API).
  r.post('/importar', engenheiro, upload.array('arquivos', 50), async (req, res) => {
    if (!req.files?.length) return res.status(400).json({ erro: 'Envie ao menos um arquivo no campo "arquivos".' });
    const demandas = [];
    const falhasLeitura = [];
    for (const f of req.files) {
      const nome = Buffer.from(f.originalname, 'latin1').toString('utf8');
      try {
        const lidas = lerDemandas(nome, f.buffer);
        if (!lidas.length) falhasLeitura.push({ origem: nome, erros: ['Nenhuma demanda encontrada no arquivo.'] });
        demandas.push(...lidas);
      } catch (e) {
        falhasLeitura.push({ origem: nome, erros: [`Não foi possível ler o arquivo: ${e.message}`] });
      }
    }
    const resultados = processar(demandas, await obterCatalogo(store));
    log(req, 'PO_IMPORTADA', { arquivos: req.files.length, demandas: demandas.length });

    if (req.query.saida === 'xlsx') {
      const pos = exigirPOs(resultados);
      res.setHeader('Content-Type', XLSX_MIME);
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo(pos)}"`);
      return res.send(await gerarXlsx(pos));
    }
    res.json({ resultados, falhasLeitura });
  });

  // Exporta 1 ou várias POs num único .xlsx (uma aba por PO), no layout do gabarito.
  r.post('/exportar', engenheiro, async (req, res) => {
    const lista = Array.isArray(req.body?.demandas) ? req.body.demandas : [req.body];
    const pos = exigirPOs(processar(lista.map(normalizar), await obterCatalogo(store)));
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo(pos)}"`);
    res.send(await gerarXlsx(pos));
    log(req, 'PO_EXPORTADA', { titulos: pos.map((p) => p.cabecalho.titulo) });
  });

  // Gera a planilha e envia SEMPRE para o e-mail do usuário autenticado.
  r.post('/enviar', engenheiro, limiteEmail, async (req, res) => {
    const lista = Array.isArray(req.body?.demandas) ? req.body.demandas : [req.body];
    const pos = exigirPOs(processar(lista.map(normalizar), await obterCatalogo(store)));
    const arquivo = nomeArquivo(pos);
    const resultado = await store.enviarPO(req.user.email, {
      nomeArquivo: arquivo,
      base64: (await gerarXlsx(pos)).toString('base64'),
      resumo: pos.map((p) => ({ titulo: p.cabecalho.titulo, operacao: p.cabecalho.operacao, tp_min: p.tp_min })),
    }, req.user.email);
    res.json({ ...resultado, enviadoPara: req.user.email, arquivo });
    log(req, 'PO_ENVIADA', { arquivo, para: req.user.email });
  });

  return r;
}
