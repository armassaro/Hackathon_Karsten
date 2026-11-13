// Formatação pt-BR (vírgula decimal) para a interface.
export const min4 = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
export const dec = (n, casas = 2) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }));
// Sem separador de milhar, como no gabarito (RPM 4500 / 5000 / 5500).
export const inteiro = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false }));
export const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }) : '—');

/** "2,5" -> 2.5 ; aceita vírgula ou ponto vindos dos campos de texto. */
export const numeroDe = (s) => {
  if (typeof s === 'number') return s;
  const t = String(s ?? '').trim().replace(/\s/g, '');
  if (!t) return NaN;
  return Number(t.includes(',') && t.includes('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.'));
};

/** 2.5 -> "2,5" ; vazio para ausente/NaN. Usado ao levar números da API para campos de texto. */
export const textoDe = (n) => (n === undefined || n === null || Number.isNaN(n) ? '' : String(n).replace('.', ','));
