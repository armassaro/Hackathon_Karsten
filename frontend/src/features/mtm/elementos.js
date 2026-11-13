// Regras puras sobre a matriz de elementos MTM.

/** Busca por código ou descrição (sem diferenciar maiúsculas). */
export const filtrarElementos = (lista, busca) => {
  const q = busca.toLowerCase();
  return lista.filter((e) => `${e.codigo} ${e.descricao}`.toLowerCase().includes(q));
};

/** Agrupador de um código "agrupador.elemento" (ex.: "2.4" -> "2"). */
export const agrupadorDe = (codigo) => codigo.split('.')[0];

/** [[agrupador, elementos[]]] na ordem em que aparecem. */
export function agruparPorAgrupador(lista) {
  const g = new Map();
  lista.forEach((e) => { const k = agrupadorDe(e.codigo); g.set(k, [...(g.get(k) ?? []), e]); });
  return [...g.entries()];
}
