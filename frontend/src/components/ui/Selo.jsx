import { cx } from '../../lib/cx.js';

const TONS = {
  neutro: 'bg-paper text-ink-2 border-line',
  accent: 'bg-accent-soft text-accent border-accent/20',
  ok: 'bg-ok-soft text-ok border-ok/20',
  bad: 'bg-bad-soft text-bad border-bad/20',
  warn: 'bg-warn-soft text-warn border-warn/20',
};

/** Etiqueta arredondada. tom: neutro | accent | ok | bad | warn. */
export function Selo({ tom = 'neutro', children }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium', TONS[tom])}>{children}</span>;
}
