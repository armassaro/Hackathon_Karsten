import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useEvento } from './useEvento.js';

/**
 * Sessão do usuário. sessao: undefined = verificando; null = deslogado; { usuario, modo } = logado.
 * Escuta o evento global "sessao-expirada" (disparado pelo cliente da API em respostas 401).
 */
export function useSessao() {
  const [sessao, setSessao] = useState(undefined);
  const carregar = useCallback(() => api.get('/auth/eu').then((r) => setSessao({ usuario: r.usuario, modo: r.modo })), []);

  useEffect(() => { carregar().catch(() => setSessao(null)); }, [carregar]);
  useEvento('sessao-expirada', () => setSessao(null));

  const sair = useCallback(async () => { await api.post('/auth/logout').catch(() => {}); setSessao(null); }, []);
  return { sessao, aoEntrar: carregar, sair };
}
