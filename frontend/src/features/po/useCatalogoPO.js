import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useErroApi } from '../../components/feedback/index.js';

/** Matriz MTM e máquinas ativas, carregadas juntas para montar a PO. */
export function useCatalogoPO() {
  const erroApi = useErroApi();
  const [catalogo, setCatalogo] = useState({ mtm: [], maquinas: [] });
  useEffect(() => {
    Promise.all([api.get('/mtm'), api.get('/maquinas')])
      .then(([mtm, maquinas]) => setCatalogo({ mtm, maquinas }))
      .catch(erroApi);
  }, [erroApi]);
  return catalogo;
}
