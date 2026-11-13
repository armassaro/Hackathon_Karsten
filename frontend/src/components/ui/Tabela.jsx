import { cx } from '../../lib/cx.js';

/**
 * Tabela com cabeçalho padronizado. colunas: [{ rotulo, className? , chave? }]; o corpo vem em children (<tr>).
 * `rotulo` pode ser um nó (ex.: <CabecalhoOrdenavel>); nesse caso informe `chave`.
 */
export function Tabela({ colunas, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[12px] tracking-wide text-ink-3 uppercase">
            {colunas.map((c, i) => <th key={c.chave ?? (typeof c.rotulo === 'string' ? c.rotulo : i)} className={cx('px-3 py-2 font-semibold', c.className)}>{c.rotulo}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
