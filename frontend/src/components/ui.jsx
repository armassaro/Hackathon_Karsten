// Componentes de interface reutilizáveis.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const cx = (...c) => c.filter(Boolean).join(' ');

export function Botao({ variante = 'primario', tamanho = 'md', carregando = false, className, children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent whitespace-nowrap';
  const tamanhos = { sm: 'h-8 px-3 text-[13px]', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-[15px]' };
  const variantes = {
    primario: 'bg-accent text-white hover:bg-accent-2',
    secundario: 'bg-card text-ink border border-line-2 hover:bg-paper',
    fantasma: 'text-ink-2 hover:bg-black/5',
    perigo: 'bg-bad text-white hover:bg-[#912018]',
    perigoSuave: 'text-bad hover:bg-bad-soft',
  };
  return (
    <button className={cx(base, tamanhos[tamanho], variantes[variante], className)} disabled={carregando || props.disabled} {...props}>
      {carregando && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function Campo({ rotulo, dica, erro, children, className }) {
  return (
    <label className={cx('flex flex-col gap-1', className)}>
      <span className="text-[12px] font-semibold tracking-wide text-ink-2 uppercase">{rotulo}</span>
      {children}
      {erro ? <span className="text-xs text-bad">{erro}</span> : dica && <span className="text-xs text-ink-3">{dica}</span>}
    </label>
  );
}

export const estiloEntrada = 'h-9 w-full rounded-md border border-line-2 bg-white px-3 text-sm text-ink placeholder:text-ink-3/70 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:bg-paper';

export function Entrada({ className, ...props }) {
  return <input className={cx(estiloEntrada, className)} {...props} />;
}

export function Selecao({ className, children, ...props }) {
  return <select className={cx(estiloEntrada, 'pr-8', className)} {...props}>{children}</select>;
}

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

export function Selo({ tom = 'neutro', children }) {
  const tons = {
    neutro: 'bg-paper text-ink-2 border-line',
    accent: 'bg-accent-soft text-accent border-accent/20',
    ok: 'bg-ok-soft text-ok border-ok/20',
    bad: 'bg-bad-soft text-bad border-bad/20',
    warn: 'bg-warn-soft text-warn border-warn/20',
  };
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium', tons[tom])}>{children}</span>;
}

export function Modal({ aberto, titulo, aoFechar, children, rodape, largura = 'max-w-lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!aberto) return;
    const esc = (e) => e.key === 'Escape' && aoFechar?.();
    window.addEventListener('keydown', esc);
    ref.current?.querySelector('input,select,button')?.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [aberto, aoFechar]);
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && aoFechar?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={titulo} className={cx('w-full rounded-lg bg-card shadow-xl', largura)}>
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-base font-semibold">{titulo}</h3>
          <button onClick={aoFechar} className="rounded p-1 text-ink-3 hover:bg-paper hover:text-ink" aria-label="Fechar">✕</button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {rodape && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{rodape}</footer>}
      </div>
    </div>
  );
}

// ---------- Confirmação (substitui window.confirm) ----------
const ConfirmCtx = createContext(null);
export function ProvedorConfirmacao({ children }) {
  const [estado, setEstado] = useState(null);
  const confirmar = useCallback((opcoes) => new Promise((resolve) => setEstado({ ...opcoes, resolve })), []);
  const fechar = (v) => { estado?.resolve(v); setEstado(null); };
  return (
    <ConfirmCtx.Provider value={confirmar}>
      {children}
      <Modal aberto={!!estado} titulo={estado?.titulo} aoFechar={() => fechar(false)}
        rodape={<>
          <Botao variante="secundario" onClick={() => fechar(false)}>Cancelar</Botao>
          <Botao variante={estado?.perigo ? 'perigo' : 'primario'} onClick={() => fechar(true)}>{estado?.confirmar || 'Confirmar'}</Botao>
        </>}>
        <p className="text-sm text-ink-2">{estado?.mensagem}</p>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
export const useConfirmar = () => useContext(ConfirmCtx);

// ---------- Avisos (toasts) ----------
const AvisoCtx = createContext(null);
export function ProvedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);
  const avisar = useCallback((texto, tom = 'ok', detalhes = []) => {
    const id = Math.random();
    setAvisos((a) => [...a, { id, texto, tom, detalhes }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tom === 'bad' ? 7000 : 4000);
  }, []);
  return (
    <AvisoCtx.Provider value={avisar}>
      {children}
      <div className="no-print pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={cx('pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-lg',
            a.tom === 'bad' ? 'border-bad/30 bg-bad-soft text-bad' : a.tom === 'warn' ? 'border-warn/30 bg-warn-soft text-warn' : 'border-ok/30 bg-ok-soft text-ok')}>
            <p className="font-medium">{a.texto}</p>
            {a.detalhes?.length > 0 && <ul className="mt-1 list-disc pl-4 text-[13px]">{a.detalhes.map((d) => <li key={d}>{d}</li>)}</ul>}
          </div>
        ))}
      </div>
    </AvisoCtx.Provider>
  );
}
export const useAvisar = () => useContext(AvisoCtx);

/** Mostra um erro da API como aviso (com a lista de erros de validação, quando houver). */
export function useErroApi() {
  const avisar = useAvisar();
  return useCallback((e) => avisar(e.message, 'bad', e.erros), [avisar]);
}

export function Vazio({ children }) {
  return <div className="rounded-md border border-dashed border-line-2 px-4 py-8 text-center text-sm text-ink-3">{children}</div>;
}

export function Tabela({ colunas, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[12px] tracking-wide text-ink-3 uppercase">
            {colunas.map((c) => <th key={c.rotulo} className={cx('px-3 py-2 font-semibold', c.className)}>{c.rotulo}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
