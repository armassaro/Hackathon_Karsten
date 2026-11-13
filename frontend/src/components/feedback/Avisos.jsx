// Avisos (toasts) no canto inferior direito.
//  - avisar(texto, tom = 'ok' | 'warn' | 'bad', detalhes = []): aviso simples que some sozinho.
//  - useAvisoProgresso()(titulo, etapa): aviso persistente de uma operação longa. Fica na tela enquanto a
//    operação roda (inclusive ao trocar de página) e mostra a etapa atual; ao concluir, vira sucesso (some
//    depois de alguns segundos) ou falha (fica até o usuário fechar).
import { createContext, useCallback, useContext, useState } from 'react';
import { cx } from '../../lib/cx.js';
import { Girador } from '../ui/Girador.jsx';

const AvisoCtx = createContext(null);
const ProgressoCtx = createContext(null);
const DURACAO = { bad: 7000, padrao: 4000, concluido: 10000 };
const TONS = {
  ok: 'border-ok/30 bg-ok-soft text-ok',
  warn: 'border-warn/30 bg-warn-soft text-warn',
  bad: 'border-bad/30 bg-bad-soft text-bad',
  progresso: 'border-line bg-card text-ink',
};

const novoId = () => Math.random().toString(36).slice(2);

export function ProvedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);
  const remover = useCallback((id) => setAvisos((a) => a.filter((x) => x.id !== id)), []);
  const mudar = useCallback((id, mudancas) => setAvisos((a) => a.map((x) => (x.id === id ? { ...x, ...mudancas } : x))), []);

  const avisar = useCallback((texto, tom = 'ok', detalhes = []) => {
    const id = novoId();
    setAvisos((a) => [...a, { id, texto, tom, detalhes }]);
    setTimeout(() => remover(id), DURACAO[tom] ?? DURACAO.padrao);
  }, [remover]);

  const progresso = useCallback((texto, etapa) => {
    const id = novoId();
    setAvisos((a) => [...a, { id, texto, tom: 'progresso', etapa }]);
    return {
      etapa: (novaEtapa) => mudar(id, { etapa: novaEtapa }),
      sucesso: (novoTexto, { detalhes = [], link = null } = {}) => {
        mudar(id, { texto: novoTexto, tom: 'ok', etapa: null, detalhes, link, fechavel: true });
        setTimeout(() => remover(id), DURACAO.concluido);
      },
      falha: (novoTexto, detalhes = []) => mudar(id, { texto: novoTexto, tom: 'bad', etapa: null, detalhes, fechavel: true }),
    };
  }, [mudar, remover]);

  return (
    <AvisoCtx.Provider value={avisar}>
      <ProgressoCtx.Provider value={progresso}>
        {children}
        <PilhaAvisos avisos={avisos} aoFechar={remover} />
      </ProgressoCtx.Provider>
    </AvisoCtx.Provider>
  );
}

function PilhaAvisos({ avisos, aoFechar }) {
  return (
    <div className="no-print pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {avisos.map((a) => <Aviso key={a.id} {...a} aoFechar={() => aoFechar(a.id)} />)}
    </div>
  );
}

function Aviso({ texto, tom, detalhes, etapa, link, fechavel, aoFechar }) {
  return (
    <div className={cx('pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-lg', TONS[tom] ?? TONS.ok)} role={tom === 'bad' ? 'alert' : 'status'}>
      <div className="flex items-start gap-2">
        {tom === 'progresso' && <span className="mt-0.5 text-accent"><Girador /></span>}
        <p className="flex-1 font-medium">{texto}</p>
        {fechavel && <button type="button" onClick={aoFechar} aria-label="Fechar aviso" className="-mt-0.5 -mr-1 rounded px-1 opacity-60 hover:opacity-100">✕</button>}
      </div>
      {etapa && <p className="mt-1 text-[13px] text-ink-3">{etapa}</p>}
      {detalhes?.length > 0 && <ul className="mt-1 list-disc pl-4 text-[13px]">{detalhes.map((d) => <li key={d}>{d}</li>)}</ul>}
      {link && <a href={link.href} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-[13px] font-semibold underline underline-offset-2">{link.texto}</a>}
    </div>
  );
}

export const useAvisar = () => useContext(AvisoCtx);

/** progresso(titulo, etapa) -> { etapa(texto), sucesso(texto, { detalhes, link }), falha(texto, detalhes) }. */
export const useAvisoProgresso = () => useContext(ProgressoCtx);

/** Mostra um erro da API como aviso (com a lista de erros de validação, quando houver). */
export function useErroApi() {
  const avisar = useAvisar();
  return useCallback((e) => avisar(e.message, 'bad', e.erros), [avisar]);
}
