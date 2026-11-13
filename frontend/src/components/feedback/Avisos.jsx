// Avisos (toasts): avisar(texto, tom = 'ok' | 'warn' | 'bad', detalhes = []).
import { createContext, useCallback, useContext, useState } from 'react';
import { cx } from '../../lib/cx.js';

const AvisoCtx = createContext(null);
const DURACAO = { bad: 7000, padrao: 4000 };
const TONS = {
  ok: 'border-ok/30 bg-ok-soft text-ok',
  warn: 'border-warn/30 bg-warn-soft text-warn',
  bad: 'border-bad/30 bg-bad-soft text-bad',
};

export function ProvedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);
  const avisar = useCallback((texto, tom = 'ok', detalhes = []) => {
    const id = Math.random();
    setAvisos((a) => [...a, { id, texto, tom, detalhes }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), DURACAO[tom] ?? DURACAO.padrao);
  }, []);
  return (
    <AvisoCtx.Provider value={avisar}>
      {children}
      <PilhaAvisos avisos={avisos} />
    </AvisoCtx.Provider>
  );
}

function PilhaAvisos({ avisos }) {
  return (
    <div className="no-print pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {avisos.map((a) => <Aviso key={a.id} {...a} />)}
    </div>
  );
}

function Aviso({ texto, tom, detalhes }) {
  return (
    <div className={cx('pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-lg', TONS[tom] ?? TONS.ok)}>
      <p className="font-medium">{texto}</p>
      {detalhes?.length > 0 && <ul className="mt-1 list-disc pl-4 text-[13px]">{detalhes.map((d) => <li key={d}>{d}</li>)}</ul>}
    </div>
  );
}

export const useAvisar = () => useContext(AvisoCtx);

/** Mostra um erro da API como aviso (com a lista de erros de validação, quando houver). */
export function useErroApi() {
  const avisar = useAvisar();
  return useCallback((e) => avisar(e.message, 'bad', e.erros), [avisar]);
}
