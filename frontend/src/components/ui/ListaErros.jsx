import { cx } from '../../lib/cx.js';

const VARIANTES = {
  compacta: 'rounded-md bg-bad-soft px-3 py-2 text-sm text-bad',
  destaque: 'mb-4 flex flex-col gap-1.5 rounded-md border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad',
};

/** Lista de mensagens de erro (validação). Não renderiza nada se vazia. variante: compacta | destaque. */
export function ListaErros({ erros, variante = 'compacta', className }) {
  if (!erros?.length) return null;
  return <ul className={cx(VARIANTES[variante], className)}>{erros.map((x) => <li key={x}>• {x}</li>)}</ul>;
}
