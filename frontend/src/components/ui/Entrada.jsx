import { cx } from '../../lib/cx.js';

/** Estilo base dos controles de formulário (inputs, selects e gatilhos que imitam um input). */
export const estiloEntrada = 'h-9 w-full rounded-md border border-line-2 bg-white px-3 text-sm text-ink placeholder:text-ink-3/70 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:bg-paper';

/** <input> estilizado. Aceita `ref` (React 19 repassa como prop). */
export function Entrada({ className, ...props }) {
  return <input className={cx(estiloEntrada, className)} {...props} />;
}

/** <select> estilizado. */
export function Selecao({ className, children, ...props }) {
  return <select className={cx(estiloEntrada, 'pr-8', className)} {...props}>{children}</select>;
}

/** <select> a partir de pares [valor, rótulo] ou de um objeto { valor: rótulo }. */
export function SelecaoOpcoes({ opcoes, ...props }) {
  const pares = Array.isArray(opcoes) ? opcoes : Object.entries(opcoes);
  return <Selecao {...props}>{pares.map(([v, r]) => <option key={v} value={v}>{r}</option>)}</Selecao>;
}
