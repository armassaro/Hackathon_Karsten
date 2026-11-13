import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { formEstaVazio, formParaDemanda } from './demanda.js';

export const ERRO_SEM_MAQUINA = 'Selecione uma máquina no campo "Máquina"';
export const ERRO_MEDIDAS = 'Verifique o formato de número colocado em "Medidas da peça"';
const VERIFICAR_MS = 300;

/** "1,8x2,6" ou "1,8 x 3,2": número, x, número. */
const MEDIDAS_OK = /^\s*\d+(?:[.,]\d+)?\s*[xX×]\s*\d+(?:[.,]\d+)?\s*$/;

/** Pendências conferidas no próprio formulário, antes do backend. */
function errosLocais(form) {
  const erros = [];
  if (!form.cod_eqp) erros.push(ERRO_SEM_MAQUINA);
  if (String(form.medidas ?? '').trim() && !MEDIDAS_OK.test(form.medidas)) erros.push(ERRO_MEDIDAS);
  return erros;
}

/** Junta os erros locais aos do backend (sem o erro genérico de máquina "" inexistente). */
function juntarErros(form, locais, doBackend) {
  const resto = form.cod_eqp ? doBackend : doBackend.filter((e) => !e.startsWith('Máquina com código'));
  return [...locais, ...resto];
}

/** Assinatura dos dados que entram na ficha (sem ids internos do roteiro). */
const assinatura = (form) => JSON.stringify(formParaDemanda(form));

/**
 * Ficha PO gerada sob demanda (gerar()); respostas antigas são descartadas.
 * estado: 'vazio' | 'calculando' | 'ok' | 'erro' | 'desatualizada'. `demanda` = dados que geraram a `po`.
 * 'desatualizada' = o formulário mudou desde a última geração; 300 ms após cada mudança o formulário é
 * comparado com o da última geração e, se voltou a ser igual, o estado anterior (`anterior`) é restaurado.
 */
export function usePreviewPO(form) {
  const [preview, setPreview] = useState({ estado: 'vazio' });
  const seq = useRef(0);
  const gerado = useRef(null); // assinatura do formulário da última geração

  useEffect(() => {
    if (formEstaVazio(form)) { seq.current++; gerado.current = null; setPreview({ estado: 'vazio' }); return; }
    if (gerado.current === null) return;
    const igual = assinatura(form) === gerado.current;
    if (!igual) setPreview((p) => (p.estado === 'ok' || p.estado === 'erro' ? { ...p, estado: 'desatualizada', anterior: p.estado } : p));
    const t = setTimeout(() => {
      if (assinatura(form) === gerado.current) setPreview((p) => (p.estado === 'desatualizada' ? { ...p, estado: p.anterior } : p));
    }, VERIFICAR_MS);
    return () => clearTimeout(t);
  }, [form]);

  const gerar = useCallback(async () => {
    if (formEstaVazio(form)) return;
    const n = ++seq.current;
    gerado.current = assinatura(form);
    setPreview((p) => ({ ...p, estado: 'calculando' }));
    const locais = errosLocais(form);
    const demanda = formParaDemanda(form);
    try {
      const po = await api.post('/po/preview', demanda);
      if (n !== seq.current) return;
      setPreview(locais.length ? { estado: 'erro', erros: locais, po } : { estado: 'ok', po, demanda });
    } catch (e) {
      if (n === seq.current) setPreview({ estado: 'erro', erros: juntarErros(form, locais, e.erros?.length ? e.erros : [e.message]) });
    }
  }, [form]);

  return [preview, gerar];
}
