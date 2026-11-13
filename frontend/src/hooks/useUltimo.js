import { useLayoutEffect, useRef } from 'react';

/**
 * Ref que sempre aponta para o valor mais recente. Permite usar callbacks vindos de props
 * dentro de efeitos sem colocá-los nas dependências (evita reexecutar o efeito a cada render).
 */
export function useUltimo(valor) {
  const ref = useRef(valor);
  useLayoutEffect(() => { ref.current = valor; });
  return ref;
}
