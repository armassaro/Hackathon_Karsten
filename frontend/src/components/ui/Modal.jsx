import { useEffect, useRef } from 'react';
import { cx } from '../../lib/cx.js';
import { useEvento } from '../../hooks/useEvento.js';

// Primeiro campo editável; sem ele, o primeiro controle qualquer (ex.: botão Fechar).
const FOCO_PREFERIDO = 'input:not([disabled]),select:not([disabled]),textarea:not([disabled])';
const FOCO_RESERVA = 'input,select,button';

/**
 * Diálogo modal: fecha com Esc, clique no fundo ou no ✕. `rodape` recebe os botões de ação.
 * O foco inicial é aplicado só ao abrir (não a cada render), então digitar nos campos não perde o foco.
 */
export function Modal({ aberto, titulo, aoFechar, children, rodape, largura = 'max-w-lg' }) {
  const ref = useRef(null);
  useEvento('keydown', (e) => e.key === 'Escape' && aoFechar?.(), { ativo: aberto });
  useEffect(() => {
    if (!aberto) return;
    const d = ref.current;
    (d?.querySelector(FOCO_PREFERIDO) ?? d?.querySelector(FOCO_RESERVA))?.focus();
  }, [aberto]);

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
