import { cx } from '../../lib/cx.js';

/** Rótulo curto em caixa alta usado em campos, filtros e subtítulos de painéis. */
export const ESTILO_ROTULO = 'text-[12px] font-semibold tracking-wide text-ink-2 uppercase';

export function RotuloSecao({ as: Tag = 'p', className, children }) {
  return <Tag className={cx(ESTILO_ROTULO, className)}>{children}</Tag>;
}
