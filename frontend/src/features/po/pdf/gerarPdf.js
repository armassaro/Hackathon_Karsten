// Gera o PDF da ficha em segundo plano, no computador do usuário (Web Worker).
// Se o navegador não suportar workers de módulo, gera na thread principal (carregando a biblioteca sob demanda).

/** Devolve um Blob application/pdf com a ficha `po`. */
export async function gerarPdfFicha(po) {
  const geradoEm = Date.now();
  let bytes;
  try {
    bytes = await noWorker(po, geradoEm);
  } catch (e) {
    if (e?.name !== 'SemWorker') throw e;
    const { montarPdfFicha } = await import('./fichaPdf.js');
    bytes = montarPdfFicha(po, { geradoEm: new Date(geradoEm) });
  }
  return new Blob([bytes], { type: 'application/pdf' });
}

function noWorker(po, geradoEm) {
  return new Promise((ok, falha) => {
    let worker;
    try {
      worker = new Worker(new URL('./fichaPdf.worker.js', import.meta.url), { type: 'module' });
    } catch {
      falha(Object.assign(new Error('Sem suporte a Web Worker.'), { name: 'SemWorker' }));
      return;
    }
    const fim = (fn, v) => { worker.terminate(); fn(v); };
    worker.onmessage = ({ data }) => (data.ok ? fim(ok, data.pdf) : fim(falha, new Error(`Falha ao gerar o PDF: ${data.erro}`)));
    worker.onerror = (ev) => { ev.preventDefault?.(); fim(falha, Object.assign(new Error('Falha no worker do PDF.'), { name: 'SemWorker' })); };
    worker.postMessage({ po, geradoEm });
  });
}
