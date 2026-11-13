import { cx } from '../../lib/cx.js';

const TONS = {
  forte: 'num rounded-full bg-accent px-1.5 text-[11px] leading-[18px] text-white',
  suave: 'num rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-accent',
};

/** Pílula numérica (ex.: quantidade de filtros ativos ou de itens selecionados). */
export function Contador({ tom = 'forte', className, children }) {
  return <span className={cx(TONS[tom], className)}>{children}</span>;
}
