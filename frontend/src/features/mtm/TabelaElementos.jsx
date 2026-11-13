import { min4 } from '../../lib/fmt.js';
import { Tabela } from '../../components/ui/index.js';
import { BotaoEditar, BotaoRemover, CelulaAcoes, COLUNA_ACOES } from '../cadastros/index.js';

const COLUNAS = [{ rotulo: 'Código', className: 'w-24' }, { rotulo: 'Descrição do elemento' }, { rotulo: 'Tempo (min)', className: 'text-right w-32' }];

/** Tabela da matriz MTM, com uma faixa de título por agrupador. grupos = [[agrupador, elementos[]]]. */
export function TabelaElementos({ grupos, admin, aoEditar, aoRemover }) {
  const colunas = [...COLUNAS, ...(admin ? [COLUNA_ACOES] : [])];
  return (
    <Tabela colunas={colunas}>
      {grupos.map(([g, els]) => [
        <LinhaAgrupador key={`g${g}`} agrupador={g} colunas={colunas.length} />,
        ...els.map((e) => <LinhaElemento key={e.codigo} e={e} admin={admin} aoEditar={() => aoEditar(e)} aoRemover={() => aoRemover(e)} />),
      ])}
    </Tabela>
  );
}

function LinhaAgrupador({ agrupador, colunas }) {
  return <tr className="bg-paper"><td colSpan={colunas} className="px-3 py-1.5 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">Agrupador {agrupador}</td></tr>;
}

function LinhaElemento({ e, admin, aoEditar, aoRemover }) {
  return (
    <tr>
      <td className="num px-3 py-2.5 font-semibold text-accent">{e.codigo}</td>
      <td className="px-3 py-2.5">{e.descricao}</td>
      <td className="num px-3 py-2.5 text-right">{min4(e.tempo_min)}</td>
      {admin && (
        <CelulaAcoes>
          <BotaoEditar onClick={aoEditar} />
          <BotaoRemover onClick={aoRemover} rotulo={`Remover ${e.codigo}`} />
        </CelulaAcoes>
      )}
    </tr>
  );
}
