// Funções utilitárias puras, compartilhadas por motor, leitores e exportadores.

/** Remove acentos, baixa caixa e colapsa espaços: "Cód. Eqp" -> "cod. eqp" */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converte número no formato brasileiro ou internacional.
 * "2,50" -> 2.5 · "6.96" -> 6.96 · "1.234,5" -> 1234.5 · 3 -> 3
 */
export function paraNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (valor === null || valor === undefined) return NaN;
  let s = String(valor).trim().replace(/\s/g, '');
  if (s === '') return NaN;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  return Number(s);
}

/** Arredonda para N casas evitando erro de ponto flutuante (0.670944 -> 0.6709). */
export function arredondar(n, casas = 4) {
  const f = 10 ** casas;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** Normaliza um código MTM para texto: 2.1 -> "2.1", "2,1" -> "2.1", " 3.1 " -> "3.1" */
export function codigoMTM(valor) {
  return String(valor ?? '').trim().replace(',', '.');
}

/** Remove aspas externas: "\"Bainhar...\"" -> "Bainhar..." */
export function semAspas(s) {
  return String(s ?? '').trim().replace(/^["'“”]+|["'“”]+$/g, '').trim();
}
