import { cx } from '../../lib/cx.js';

/** Alternador segmentado compacto (ex.: "Valores | Intervalo"). opcoes: [[valor, rótulo]]. */
export function Alternador({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex rounded-md border border-line-2 bg-white p-0.5 text-[12px]">
      {opcoes.map(([v, r]) => (
        <button key={v} type="button" role="radio" aria-checked={valor === v} onClick={() => aoMudar(v)}
          className={cx('rounded px-2 py-0.5 font-medium', valor === v ? 'bg-accent text-white' : 'text-ink-2 hover:bg-paper')}>{r}</button>
      ))}
    </div>
  );
}
