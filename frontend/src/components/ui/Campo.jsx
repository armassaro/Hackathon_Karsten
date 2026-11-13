import { cx } from '../../lib/cx.js';
import { ESTILO_ROTULO } from './RotuloSecao.jsx';

/** Rótulo + controle + dica/erro. O <label> envolve o controle, então clicar no rótulo foca o campo. */
export function Campo({ rotulo, dica, erro, children, className }) {
  return (
    <label className={cx('flex flex-col gap-1', className)}>
      <span className={ESTILO_ROTULO}>{rotulo}</span>
      {children}
      {erro ? <span className="text-xs text-bad">{erro}</span> : dica && <span className="text-xs text-ink-3">{dica}</span>}
    </label>
  );
}
