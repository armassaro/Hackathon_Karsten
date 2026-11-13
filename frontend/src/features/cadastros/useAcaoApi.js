import { useCallback } from 'react';
import { useAvisar, useConfirmar, useErroApi } from '../../components/feedback/index.js';

/**
 * Executa uma ação na API com o padrão das telas de cadastro:
 * (confirmação opcional) -> chamada -> aviso de sucesso -> recarregar; erro vira aviso.
 * executar({ confirmar?: opcoesDoConfirmar, chamar: () => Promise, sucesso?: texto | (r) => texto, depois?: (r) => void })
 */
export function useAcaoApi() {
  const avisar = useAvisar();
  const erroApi = useErroApi();
  const confirmar = useConfirmar();
  return useCallback(async ({ confirmar: pergunta, chamar, sucesso, depois }) => {
    if (pergunta && !(await confirmar(pergunta))) return;
    try {
      const r = await chamar();
      if (sucesso) avisar(typeof sucesso === 'function' ? sucesso(r) : sucesso);
      depois?.(r);
    } catch (e) { erroApi(e); }
  }, [avisar, erroApi, confirmar]);
}
