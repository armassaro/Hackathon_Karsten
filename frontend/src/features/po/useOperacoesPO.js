import { useState } from 'react';
import { api, salvarArquivo } from '../../lib/api.js';
import { useAvisar, useErroApi } from '../../components/feedback/index.js';

/** Itens válidos de um lote importado. */
export const validasDoLote = (lote) => (lote ?? []).filter((x) => x.po);

/**
 * Operações sobre POs (exportar, enviar por e-mail, imprimir e importar arquivos).
 * ocupado: '' | 'baixar' | 'enviar' | 'importar'. imprimir: POs na fila de impressão (ou null).
 * aoCarregarUnica(demanda): chamado quando a importação traz exatamente uma demanda válida.
 */
export function useOperacoesPO({ aoCarregarUnica }) {
  const avisar = useAvisar();
  const erroApi = useErroApi();
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
    ocupado, imprimir, lote, baixar, enviar, imprimirPOs, importar,
    baixarLote: () => baixar(loteValido.map((x) => x.demanda)),
    enviarLote: () => enviar(loteValido.map((x) => x.demanda)),
    imprimirLote: () => imprimirPOs(loteValido.map((x) => x.po)),
  };
}
