import { useState } from 'react';
import { useEvento } from './useEvento.js';

const lerHash = (padrao) => window.location.hash.replace('#/', '') || padrao;

/** Página atual a partir de "#/pagina" (atualiza no hashchange). */
export function useRotaHash(padrao) {
  const [rota, setRota] = useState(() => lerHash(padrao));
  useEvento('hashchange', () => setRota(lerHash(padrao)));
  return rota;
}
