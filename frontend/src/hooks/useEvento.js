import { useEffect } from 'react';
import { useUltimo } from './useUltimo.js';

/** Escuta `nome` em `alvo` (padrão: window) enquanto `ativo`. O handler pode mudar sem reinscrever. */
export function useEvento(nome, handler, { alvo = window, ativo = true, captura = false } = {}) {
  const ref = useUltimo(handler);
  useEffect(() => {
    if (!ativo) return;
    const f = (e) => ref.current(e);
    alvo.addEventListener(nome, f, captura);
    return () => alvo.removeEventListener(nome, f, captura);
  }, [nome, alvo, ativo, captura, ref]);
}
