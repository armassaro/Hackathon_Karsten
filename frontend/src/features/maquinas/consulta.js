// Regras puras da busca de máquinas: limites dos filtros e montagem do predicado.
import { dec, inteiro } from '../../lib/fmt.js';
import { ehTudo, faixa, recortar } from '../../lib/intervalo.js';

export const FILTROS_VAZIOS = { codigo: null, tipos: [], rpmModo: 'valores', rpms: [], rpmIntervalo: null, tempo: null };
export const CONSULTA_VAZIA = { busca: '', filtros: FILTROS_VAZIOS, verInativas: false };
export const MODOS_RPM = [['valores', 'Valores'], ['intervalo', 'Intervalo']];

export const codigoNum = (m) => Number.parseFloat(String(m.codigo).replace(',', '.'));
export const inteiroBR = (n) => String(Math.round(n));
export const tempoBR = (n) => dec(n, 4);
const unicos = (lista) => [...new Set(lista)];
const ok = (n) => Number.isFinite(n);

/** Limites dos sliders e opções das listas, calculados a partir do cadastro. */
export function limitesDe(itens) {
  return {
    codigo: faixa(itens.map(codigoNum).filter(ok)),
    rpm: faixa(itens.map((m) => m.rpm).filter(ok)),
    tempo: faixa(itens.map((m) => m.tempo_por_metro).filter(ok)),
    tipos: unicos(itens.map((m) => m.tipo).filter(Boolean)).sort((x, y) => x.localeCompare(y, 'pt-BR')).map((t) => ({ valor: t, rotulo: t })),
    rpms: unicos(itens.map((m) => m.rpm).filter(ok)).sort((x, y) => x - y).map((v) => ({ valor: v, rotulo: inteiro(v) })),
  };
}

/**
 * Converte a consulta aplicada em um único predicado, montado UMA vez por busca:
 * o texto é normalizado e as listas viram Set antes de percorrer as máquinas.
 * Também devolve quantos filtros estão ativos (para o contador do botão).
 */
export function montarConsulta({ busca, filtros: f, verInativas }, lim) {
  const testes = [];
  const q = busca.trim().toLowerCase();
  if (q) testes.push((m) => `${m.codigo} ${m.tipo} ${m.descricao}`.toLowerCase().includes(q));
  if (!verInativas) testes.push((m) => m.ativo !== false);

  let n = verInativas ? 1 : 0;
  const dentro = (v, limites, ler) => {
    if (!v) return;
    const [lo, hi] = recortar(v, limites);
    if (ehTudo([lo, hi], limites)) return;
    n++; testes.push((m) => { const x = ler(m); return Number.isFinite(x) && x >= lo && x <= hi; });
  };
  const naLista = (valores, ler) => {
    if (!valores.length) return;
    const set = new Set(valores);
    n++; testes.push((m) => set.has(ler(m)));
  };
  dentro(f.codigo, lim.codigo, codigoNum);
  naLista(f.tipos, (m) => m.tipo);
  if (f.rpmModo === 'valores') naLista(f.rpms, (m) => m.rpm);
  else dentro(f.rpmIntervalo, lim.rpm, (m) => m.rpm);
  dentro(f.tempo, lim.tempo, (m) => m.tempo_por_metro);

  return { passa: (m) => testes.every((t) => t(m)), nAtivos: n };
}

/** Duas consultas são iguais? (compara o conteúdo, não a referência). */
export const mesmaConsulta = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
