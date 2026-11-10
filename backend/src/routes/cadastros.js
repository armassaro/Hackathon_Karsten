// Cadastros de apoio: Máquinas (TEMPO-CM) e Matriz de Elementos (MTM).
import { Router } from 'express';
import multer from 'multer';
import { exigir } from '../auth/middleware.js';
import { maquinaSchema, mtmSchema } from '../schemas.js';
import { lerCatalogo } from '../ingest/catalogo.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export function rotasCadastros(store) {
  const r = Router();
  const admin = exigir('admin', store);
  const log = (req, acao, det) => store.registrarLog(req.user.email, acao, det).catch(() => {});

  // ---------- Máquinas ----------
  r.get('/maquinas', async (req, res) => {
    const todas = await store.listarMaquinas();
    const verInativas = req.query.inativas === '1' && req.user.papel === 'admin';
    res.json(verInativas ? todas : todas.filter((m) => m.ativo !== false));
  });

  r.post('/maquinas', admin, async (req, res) => {
    const m = maquinaSchema.parse(req.body);
    res.status(201).json(await store.criarMaquina(m, req.user.email));
    log(req, 'MAQUINA_CRIADA', m);
  });

  r.put('/maquinas/:codigo', admin, async (req, res) => {
    const m = maquinaSchema.parse({ ...req.body, codigo: req.params.codigo });
    res.json(await store.atualizarMaquina(req.params.codigo, m, req.user.email));
    log(req, 'MAQUINA_EDITADA', m);
  });

  // Soft delete: POs antigas continuam consistentes.
  r.delete('/maquinas/:codigo', admin, async (req, res) => {
    res.json(await store.desativarMaquina(req.params.codigo, req.user.email));
    log(req, 'MAQUINA_DESATIVADA', { codigo: req.params.codigo });
  });

  r.post('/maquinas/:codigo/reativar', admin, async (req, res) => {
    res.json(await store.reativarMaquina(req.params.codigo, req.user.email));
    log(req, 'MAQUINA_REATIVADA', { codigo: req.params.codigo });
  });

  // ---------- Matriz MTM ----------
  r.get('/mtm', async (req, res) => {
    const lista = await store.listarMTM();
    lista.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }));
    res.json(lista);
  });

  r.post('/mtm', admin, async (req, res) => {
    const e = mtmSchema.parse(req.body);
    res.status(201).json(await store.criarMTM(e, req.user.email));
    log(req, 'MTM_CRIADO', e);
  });

  r.put('/mtm/:codigo', admin, async (req, res) => {
    const e = mtmSchema.parse({ ...req.body, codigo: req.params.codigo });
    res.json(await store.atualizarMTM(req.params.codigo, e, req.user.email));
    log(req, 'MTM_EDITADO', e);
  });

  r.delete('/mtm/:codigo', admin, async (req, res) => {
    await store.removerMTM(req.params.codigo, req.user.email);
    res.json({ ok: true });
    log(req, 'MTM_REMOVIDO', { codigo: req.params.codigo });
  });

  // ---------- Carga da planilha de cadastros (Entradas.ods/.xlsx) ----------
  r.post('/catalogo/importar', admin, upload.single('arquivo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ erro: 'Envie o arquivo no campo "arquivo".' });
    const cat = lerCatalogo(req.file.buffer);
    cat.elementos.forEach((e) => mtmSchema.parse(e));
    cat.maquinas.forEach((m) => maquinaSchema.parse(m));
    const resumo = await store.importarCatalogo(cat, req.user.email);
    res.json({ ...resumo, arquivo: req.file.originalname });
    log(req, 'CATALOGO_IMPORTADO', { arquivo: req.file.originalname, ...resumo });
  });

  return r;
}
