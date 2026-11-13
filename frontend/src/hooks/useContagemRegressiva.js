import { useLayoutEffect, useState } from 'react';

/** Segundos restantes até `expiraEm` (ms), atualizados a cada segundo enquanto `ativo`; e o texto "mm:ss". */
export function useContagemRegressiva(expiraEm, ativo) {
  const [agora, setAgora] = useState(Date.now());
  // Layout effect: zera o relógio antes da pintura, sem piscar um valor antigo ao (re)iniciar.
  useLayoutEffect(() => {
    if (!ativo) return;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ativo, expiraEm]);
  const restante = Math.max(0, Math.round((expiraEm - agora) / 1000));
  const mmss = `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}`;
  return { restante, mmss };
}
