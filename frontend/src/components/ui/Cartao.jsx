import { cx } from '../../lib/cx.js';

/** Painel branco com borda; `titulo` e `acao` montam um cabeçalho opcional. */
export function Cartao({ titulo, acao, children, className, corpoClassName }) {
  return (
    <section className={cx('rounded-lg border border-line bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className)}>
      {titulo && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-semibold text-ink">{titulo}</h2>
          {acao}
        </header>
      )}
      <div className={cx('p-4', corpoClassName)}>{children}</div>
    </section>
  );
}

/** Faixa no topo de um Cartao sem padding (barra de busca/ferramentas). */
export function BarraCartao({ className = 'flex items-center gap-3', children, ...props }) {
  return <div className={cx(className, 'border-b border-line p-3')} {...props}>{children}</div>;
}

/** Texto de apoio numa faixa do Cartao (ex.: explicação acima/abaixo de uma tabela). */
export function NotaCartao({ topo = false, children }) {
  return <p className={cx(topo ? 'border-b' : 'border-t', 'border-line px-4 py-3 text-[13px] text-ink-3')}>{children}</p>;
}
