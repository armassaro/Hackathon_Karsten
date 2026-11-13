import { useEvento } from './useEvento.js';

/** Chama aoClicarFora quando há um pointerdown fora de todos os `refs` (enquanto `ativo`). */
export function useCliqueFora(refs, aoClicarFora, ativo = true) {
  useEvento('pointerdown', (e) => {
    if (!refs.some((r) => r.current?.contains(e.target))) aoClicarFora(e);
  }, { alvo: document, ativo });
}
