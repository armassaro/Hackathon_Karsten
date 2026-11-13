import { useState } from 'react';
import { api, salvarArquivo } from '../../lib/api.js';
import { useAvisar, useAvisoProgresso, useErroApi } from '../../components/feedback/index.js';
import { gerarPdfFicha } from './pdf/gerarPdf.js';

/** Itens válidos de um lote importado. */
export const validasDoLote = (lote) => (lote ?? []).filter((x) => x.po);

/**
 * Operações sobre POs (exportar, enviar por e-mail, guardar no Google Drive, imprimir e importar arquivos).
 * ocupado: '' | 'baixar' | 'enviar' | 'drive' | 'importar'. imprimir: POs na fila de impressão (ou null).
 * aoCarregarUnica(demanda): chamado quando a importação traz exatamente uma demanda válida.
 */
export function useOperacoesPO({ aoCarregarUnica }) {
  const avisar = useAvisar();
  const erroApi = useErroApi();
  const progresso = useAvisoProgresso();
  const [ocupado, setOcupado] = useState('');
  const [imprimir, setImprimir] = useState(null);
  const [lote, setLote] = useState(null);

  async function baixar(demandas) {
    setOcupado('baixar');
    try { salvarArquivo(await api.baixar('/po/exportar', { demandas })); avisar('Planilha gerada no layout do gabarito.'); }
    catch (e) { erroApi(e); } finally { setOcupado(''); }
  }

  async function enviar(demandas) {
    setOcupado('enviar');
    try {
      const r = await api.post('/po/enviar', { demandas });
      avisar(r.simulado ? `Modo local: ficha salva em backend/data/enviados (iria para ${r.enviadoPara}).` : `Enviado para ${r.enviadoPara}.`);
    } catch (e) { erroApi(e); } finally { setOcupado(''); }
  }

  /**
   * Gera o PDF da ficha `po` no navegador (Web Worker) e o envia ao backend, que confere a `demanda`,
   * assina a requisição e a repassa ao Apps Script do Drive. O aviso acompanha cada etapa até o fim,
   * mesmo se o usuário trocar de página no meio.
   */
  async function guardarNoDrive(po, demanda) {
    const titulo = po.cabecalho.titulo || 'sem título';
    const aviso = progresso(`Guardando a ficha "${titulo}" no Google Drive`, '1/2 · Gerando o PDF no seu computador…');
    setOcupado('drive');
    try {
      const pdf = await gerarPdfFicha(po);
      aviso.etapa('2/2 · Enviando e guardando no Google Drive…');
      const fd = new FormData();
      fd.append('demanda', JSON.stringify(demanda));
      fd.append('pdf', pdf, 'ficha.pdf');
      const r = await api.post('/po/drive', fd);
      const link = /^https:\/\/(drive|docs)\.google\.com\//.test(r.link ?? '') ? { href: r.link, texto: 'Abrir no Google Drive' } : null;
      aviso.sucesso(`Ficha "${titulo}" guardada no Google Drive.`, { detalhes: [`${r.caminho} / ${r.nome}`], link });
    } catch (e) {
      aviso.falha(`Não foi possível guardar a ficha "${titulo}" no Google Drive.`, e.erros?.length ? e.erros : [e.message]);
    } finally { setOcupado(''); }
  }

  /** Renderiza as fichas na área de impressão e abre o diálogo do navegador. */
  function imprimirPOs(pos) {
    setImprimir(pos);
    setTimeout(() => { window.print(); setImprimir(null); }, 50);
  }

  async function importar(arquivos) {
    if (!arquivos?.length) return;
    const fd = new FormData();
    [...arquivos].forEach((a) => fd.append('arquivos', a));
    setOcupado('importar');
    try {
      const r = await api.post('/po/importar', fd);
      const todos = [...r.resultados, ...r.falhasLeitura.map((f) => ({ demanda: { origem: f.origem, titulo: '' }, erros: f.erros }))];
      setLote(todos);
      const validas = validasDoLote(todos);
      if (todos.length === 1 && validas.length === 1) {
        aoCarregarUnica(todos[0].demanda);
        avisar(`"${todos[0].demanda.origem}" carregado no formulário.`);
      } else {
        avisar(`${todos.length} demanda(s) lida(s): ${validas.length} válida(s), ${todos.length - validas.length} com erro.`, validas.length === todos.length ? 'ok' : 'warn');
      }
    } catch (e) { erroApi(e); } finally { setOcupado(''); }
  }

  const loteValido = validasDoLote(lote);
  return {
    ocupado, imprimir, lote, baixar, enviar, guardarNoDrive, imprimirPOs, importar,
    baixarLote: () => baixar(loteValido.map((x) => x.demanda)),
    enviarLote: () => enviar(loteValido.map((x) => x.demanda)),
    imprimirLote: () => imprimirPOs(loteValido.map((x) => x.po)),
  };
}
