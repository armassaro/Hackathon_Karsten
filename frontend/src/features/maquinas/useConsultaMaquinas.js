import { useMemo, useState } from 'react';
import { ordenar } from '../../lib/ordenacao.js';
import { CONSULTA_VAZIA, FILTROS_VAZIOS, limitesDe, mesmaConsulta, montarConsulta } from './consulta.js';

/**
 * Estado da busca de máquinas. rascunho = o que está nos campos; aplicada = o que filtra a tabela.
 * A filtragem só roda ao buscar; reordenar não refiltra.
 */
export function useConsultaMaquinas(itens) {
  const [rascunho, setRascunho] = useState(CONSULTA_VAZIA);
  const [aplicada, setAplicada] = useState(CONSULTA_VAZIA);
  const [ordem, setOrdem] = useState({ campo: 'codigo', asc: true });

  const lim = useMemo(() => limitesDe(itens ?? []), [itens]);
  const consulta = useMemo(() => montarConsulta(aplicada, lim), [aplicada, lim]);
  const filtradas = useMemo(() => (itens ?? []).filter(consulta.passa), [itens, consulta]);
  const visiveis = useMemo(() => ordenar(filtradas, ordem), [filtradas, ordem]);

  const buscar = (e) => { e?.preventDefault(); setAplicada(rascunho); };
  const limparFiltros = () => {
    const c = { ...rascunho, filtros: FILTROS_VAZIOS, verInativas: false };
    setRascunho(c); setAplicada(c);
  };

  return {
    rascunho, setRascunho, lim, visiveis, ordem, setOrdem, buscar, limparFiltros,
    nAtivos: consulta.nAtivos,
    pendente: !mesmaConsulta(rascunho, aplicada),
  };
}
