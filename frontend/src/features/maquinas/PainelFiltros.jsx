import { numeroDe } from '../../lib/fmt.js';
import { FiltroIntervalo, FiltroLista } from '../../components/filtros/index.js';
import { Alternador, Botao, Caixa, Recolhivel } from '../../components/ui/index.js';
import { inteiroBR, MODOS_RPM, tempoBR } from './consulta.js';

/** Filtros avançados (recolhíveis). Edita o rascunho da consulta; o envio é feito pelo <form> pai. */
export function PainelFiltros({ id, aberto, consulta, setConsulta, lim, admin, aoLimpar }) {
  const { filtros } = consulta;
  const set = (campo) => (v) => setConsulta((c) => ({ ...c, filtros: { ...c.filtros, [campo]: v } }));
  return (
    <Recolhivel id={id} aberto={aberto}>
      <div className="grid gap-x-6 gap-y-5 border-b border-line bg-paper/60 p-4 sm:grid-cols-2">
        <FiltroIntervalo titulo="Código" limites={lim.codigo} valor={filtros.codigo} aoMudar={set('codigo')}
          formatar={inteiroBR} lerTexto={numeroDe} />
        <FiltroIntervalo titulo="Tempo/metro (min/m)" limites={lim.tempo} valor={filtros.tempo} aoMudar={set('tempo')}
          passo={0.0001} formatar={tempoBR} lerTexto={numeroDe} />
        <FiltroLista titulo="Tipo" opcoes={lim.tipos} selecionados={filtros.tipos} aoMudar={set('tipos')} placeholder="Todos os tipos" />
        <FiltroRpm filtros={filtros} lim={lim} set={set} />
        <RodapeFiltros admin={admin} verInativas={consulta.verInativas} aoLimpar={aoLimpar}
          setVerInativas={(v) => setConsulta((c) => ({ ...c, verInativas: v }))} />
      </div>
    </Recolhivel>
  );
}

/** RPM padrão: por valores (lista) ou por intervalo (slider), conforme o alternador. */
function FiltroRpm({ filtros, lim, set }) {
  const alternador = <Alternador rotulo="Modo do filtro de RPM" opcoes={MODOS_RPM} valor={filtros.rpmModo} aoMudar={set('rpmModo')} />;
  return filtros.rpmModo === 'valores'
    ? <FiltroLista titulo="RPM padrão" opcoes={lim.rpms} selecionados={filtros.rpms} aoMudar={set('rpms')} placeholder="Todos os RPMs" acao={alternador} />
    : <FiltroIntervalo titulo="RPM padrão" limites={lim.rpm} valor={filtros.rpmIntervalo} aoMudar={set('rpmIntervalo')}
        formatar={inteiroBR} lerTexto={numeroDe} acao={alternador} />;
}

function RodapeFiltros({ admin, verInativas, setVerInativas, aoLimpar }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 sm:col-span-2">
      {admin
        ? <Caixa rotulo="Mostrar desativadas" className="flex items-center gap-2 text-sm text-ink-2" inputClassName="accent-accent"
            checked={verInativas} onChange={(e) => setVerInativas(e.target.checked)} />
        : <span />}
      <div className="flex gap-2">
        <Botao type="button" tamanho="sm" variante="fantasma" onClick={aoLimpar}>Limpar filtros</Botao>
        <Botao type="submit" tamanho="sm">Buscar máquinas</Botao>
      </div>
    </div>
  );
}
