// Web Worker: gera o PDF da ficha fora da thread da interface.
import { montarPdfFicha } from './fichaPdf.js';

self.onmessage = ({ data }) => {
  try {
    const pdf = montarPdfFicha(data.po, { geradoEm: new Date(data.geradoEm) });
    self.postMessage({ ok: true, pdf }, [pdf]);
  } catch (e) {
    self.postMessage({ ok: false, erro: e.message || String(e) });
  }
};
