// Cliente HTTP único. Usa o cookie de sessão (HttpOnly) — o frontend não guarda segredo nenhum.

export class ErroApi extends Error {
  constructor(status, corpo) {
    super(corpo?.erro || `Erro ${status}`);
    this.status = status;
    this.erros = corpo?.erros || [];
  }
}

async function requisitar(metodo, rota, corpo, { arquivo = false } = {}) {
  const opcoes = { method: metodo, credentials: 'same-origin', headers: {} };
  if (corpo instanceof FormData) opcoes.body = corpo;
  else if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }
  const r = await fetch(`/api${rota}`, opcoes);
  if (r.status === 401 && !rota.startsWith('/auth/')) window.dispatchEvent(new Event('sessao-expirada'));
  if (!r.ok) {
    let dados = null;
    try { dados = await r.json(); } catch { /* corpo vazio */ }
    throw new ErroApi(r.status, dados);
  }
  if (arquivo) {
    const nome = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || 'PO.xlsx';
    return { blob: await r.blob(), nome };
  }
  return r.json();
}

export const api = {
  get: (rota) => requisitar('GET', rota),
  post: (rota, corpo) => requisitar('POST', rota, corpo),
  put: (rota, corpo) => requisitar('PUT', rota, corpo),
  del: (rota) => requisitar('DELETE', rota),
  baixar: (rota, corpo) => requisitar('POST', rota, corpo, { arquivo: true }),
};

export function salvarArquivo({ blob, nome }) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
