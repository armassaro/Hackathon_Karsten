import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { formEstaVazio, formParaDemanda } from './demanda.js';

const ATRASO_MS = 250;

/**
 * Pré-visualização ao vivo da ficha (debounce de 250 ms; respostas antigas são descartadas).
 * estado: 'vazio' | 'calculando' | 'ok' | 'erro'. Durante 'calculando' a última `po` continua disponível.
 */
export function usePreviewPO(form) {
  const [preview, setPreview] = useState({ estado: 'vazio' });
  const seq = useRef(0);
  useEffect(() => {
    if (formEstaVazio(form)) { setPreview({ estado: 'vazio' }); return; }
    const n = ++seq.current;
    setPreview((p) => ({ ...p, estado: 'calculando' }));
    const t = setTimeout(async () => {
      try {
        const po = await api.post('/po/preview', formParaDemanda(form));
        if (n === seq.current) setPreview({ estado: 'ok', po });
      } catch (e) {
        if (n === seq.current) setPreview({ estado: 'erro', erros: e.erros?.length ? e.erros : [e.message] });
      }
    }, ATRASO_MS);
    return () => clearTimeout(t);
  }, [form]);
  return preview;
}
