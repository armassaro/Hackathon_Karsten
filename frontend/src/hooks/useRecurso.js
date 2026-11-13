import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useErroApi } from '../components/feedback/Avisos.jsx';

/**
 * Carrega `rota` (GET) ao montar e sempre que a rota mudar. Erros viram aviso.
 * Devolve [dados, recarregar]; dados = null enquanto carrega pela primeira vez.
 */
export function useRecurso(rota) {
  const [dados, setDados] = useState(null);
  const erroApi = useErroApi();
  const recarregar = useCallback(() => api.get(rota).then(setDados).catch(erroApi), [rota, erroApi]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return [dados, recarregar];
}
