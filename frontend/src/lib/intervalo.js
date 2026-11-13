// Utilitários de intervalos numéricos [inicio, fim] usados pelos sliders e filtros.

/** Ajusta v ao passo e aos limites, sem resíduo de ponto flutuante (ex.: 0.0001). */
export function ajustarAoPasso(v, min, max, passo) {
  const casas = (String(passo).split('.')[1] || '').length;
  const r = Number((Math.round((v - min) / passo) * passo + min).toFixed(casas));
  return Math.min(max, Math.max(min, r));
}

/** Recorta um intervalo guardado aos limites atuais; null = intervalo completo. */
export const recortar = (v, [lo, hi]) => (v ? [Math.max(lo, Math.min(v[0], hi)), Math.min(hi, Math.max(v[1], lo))] : [lo, hi]);

/** O intervalo cobre todos os limites (ou seja, não filtra nada)? */
export const ehTudo = (v, [lo, hi]) => v[0] <= lo && v[1] >= hi;

/** [min, max] de uma lista de números; [0, 0] se vazia. */
export const faixa = (nums) => (nums.length ? [Math.min(...nums), Math.max(...nums)] : [0, 0]);
