// Fábrica do store + cache de leitura.
// O Apps Script leva ~1 s por chamada; listas (máquinas, MTM, usuários, tokens) ficam
// em cache por 30 s e são invalidadas a cada escrita. Isso deixa a tela e a demo rápidas.
import { config } from '../config.js';
import { criarStoreLocal } from './local.js';
import { criarStoreGoogle } from './google.js';

const TTL_MS = 30_000;
const LEITURAS = { listarMaquinas: 'maquinas', listarMTM: 'mtm', listarUsuarios: 'usuarios', listarTokens: 'tokens' };
const ESCRITAS = {
  criarMaquina: ['maquinas'], atualizarMaquina: ['maquinas'], desativarMaquina: ['maquinas'], reativarMaquina: ['maquinas'],
  criarMTM: ['mtm'], atualizarMTM: ['mtm'], removerMTM: ['mtm'], importarCatalogo: ['mtm', 'maquinas'],
  salvarUsuario: ['usuarios'], criarToken: ['tokens'], revogarToken: ['tokens'],
};

export function comCache(store) {
  const cache = new Map();
  const embrulhado = { ...store };
  for (const [metodo, chave] of Object.entries(LEITURAS)) {
    embrulhado[metodo] = async (...args) => {
      const hit = cache.get(chave);
      if (hit && Date.now() - hit.em < TTL_MS) return structuredClone(hit.valor);
      const valor = await store[metodo](...args);
      cache.set(chave, { valor, em: Date.now() });
      return structuredClone(valor);
    };
  }
  for (const [metodo, chaves] of Object.entries(ESCRITAS)) {
    embrulhado[metodo] = async (...args) => {
      try { return await store[metodo](...args); } finally { chaves.forEach((c) => cache.delete(c)); }
    };
  }
  embrulhado.limparCache = () => cache.clear();
  return embrulhado;
}

export function criarStore() {
  return comCache(config.modo === 'google' ? criarStoreGoogle() : criarStoreLocal());
}

/** Catálogo no formato que o motor espera (só máquinas ativas). */
export async function obterCatalogo(store) {
  const [elementos, maquinas] = await Promise.all([store.listarMTM(), store.listarMaquinas()]);
  return { elementos, maquinas: maquinas.filter((m) => m.ativo !== false) };
}
