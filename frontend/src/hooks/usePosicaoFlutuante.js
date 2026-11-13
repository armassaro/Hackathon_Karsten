import { useLayoutEffect, useState } from 'react';

/**
 * Posição fixa (para um portal) de um painel sob o elemento `ancora`, ou acima dele se não couber.
 * Acompanha rolagem e redimensionamento enquanto `ativo`. Devolve null até medir.
 */
export function usePosicaoFlutuante(ancora, { ativo, altura = 300, larguraMin = 240, margem = 8, espaco = 4 }) {
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!ativo) return;
    const posicionar = () => {
      const r = ancora.current.getBoundingClientRect();
      const abaixo = window.innerHeight - r.bottom >= altura || r.top < altura;
      const largura = Math.max(r.width, larguraMin);
      setPos({
        left: Math.min(r.left, window.innerWidth - largura - margem), width: largura,
        ...(abaixo ? { top: r.bottom + espaco } : { bottom: window.innerHeight - r.top + espaco }),
      });
    };
    posicionar();
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    return () => { window.removeEventListener('resize', posicionar); window.removeEventListener('scroll', posicionar, true); };
  }, [ativo, ancora, altura, larguraMin, margem, espaco]);
  return pos;
}
