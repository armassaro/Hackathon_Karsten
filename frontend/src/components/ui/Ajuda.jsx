import { useId, useRef, useState } from 'react';
import { useCliqueFora } from '../../hooks/useCliqueFora.js';
import { useEvento } from '../../hooks/useEvento.js';

/**
 * Ícone "?" que abre uma caixa de ajuda flutuante logo abaixo dele (alinhada à direita, sem ocupar espaço).
 * Fecha ao clicar de novo no ícone, fora da caixa ou com Esc.
 */
export function Ajuda({ rotulo = 'Ajuda', children }) {
  const [aberta, setAberta] = useState(false);
  const raiz = useRef(null);
  const id = useId();
  useCliqueFora([raiz], () => setAberta(false), aberta);
  useEvento('keydown', (e) => { if (e.key === 'Escape') setAberta(false); }, { ativo: aberta });
  return (
    <span ref={raiz} className="relative inline-flex">
      <button type="button" aria-label={rotulo} aria-expanded={aberta} aria-controls={id} onClick={() => setAberta((a) => !a)}
        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors ${aberta ? 'border-accent bg-accent text-white' : 'border-line-2 text-ink-3 hover:border-accent hover:text-accent'}`}>?</button>
      {aberta && (
        <div id={id} role="note" aria-label={rotulo}
          className="absolute top-full right-0 z-30 mt-2 max-h-[320px] w-[min(340px,calc(100vw-32px))] overflow-y-auto overscroll-contain rounded-lg border border-line bg-card p-4 text-[13px] leading-relaxed font-normal text-ink-2 shadow-lg">
          {children}
        </div>
      )}
    </span>
  );
}
