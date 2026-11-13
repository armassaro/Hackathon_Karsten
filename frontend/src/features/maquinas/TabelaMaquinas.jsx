import { dec, inteiro } from '../../lib/fmt.js';
import { Botao, colunasOrdenaveis, Selo, Tabela } from '../../components/ui/index.js';
import { BotaoEditar, BotaoRemover, CelulaAcoes, COLUNA_ACOES } from '../cadastros/index.js';

const COLUNAS = [
  { rotulo: 'Código', campo: 'codigo' },
  { rotulo: 'Tipo', campo: 'tipo' },
  { rotulo: 'Descrição / modelo', campo: 'descricao' },
  { rotulo: 'RPM padrão', campo: 'rpm', className: 'text-right' },
  { rotulo: 'Tempo/metro (min/m)', campo: 'tempo_por_metro', className: 'text-right' },
];

/** Tabela ordenável de máquinas. As ações (editar/desativar/reativar) só aparecem para admin. */
export function TabelaMaquinas({ maquinas, ordem, setOrdem, admin, aoEditar, aoDesativar, aoReativar }) {
  const colunas = [...colunasOrdenaveis(COLUNAS, ordem, setOrdem), ...(admin ? [COLUNA_ACOES] : [])];
  return (
    <Tabela colunas={colunas}>
      {maquinas.map((m) => (
        <LinhaMaquina key={m.codigo} m={m} admin={admin}
          aoEditar={() => aoEditar(m)} aoDesativar={() => aoDesativar(m)} aoReativar={() => aoReativar(m)} />
      ))}
    </Tabela>
  );
}

function LinhaMaquina({ m, admin, aoEditar, aoDesativar, aoReativar }) {
  const inativa = m.ativo === false;
  return (
    <tr className={inativa ? 'text-ink-3' : ''}>
      <td className="num px-3 py-2.5 font-semibold">{m.codigo}</td>
      <td className="px-3 py-2.5">{m.tipo} {inativa && <Selo tom="warn">desativada</Selo>}</td>
      <td className="px-3 py-2.5">{m.descricao}</td>
      <td className="num px-3 py-2.5 text-right">{inteiro(m.rpm)}</td>
      <td className="num px-3 py-2.5 text-right">{dec(m.tempo_por_metro, 4)}</td>
      {admin && (
        <CelulaAcoes>
          {inativa ? <Botao tamanho="sm" variante="fantasma" onClick={aoReativar}>Reativar</Botao> : <>
            <BotaoEditar onClick={aoEditar} rotulo={`Editar máquina ${m.codigo}`} />
            <BotaoRemover onClick={aoDesativar} rotulo={`Desativar máquina ${m.codigo}`} />
          </>}
        </CelulaAcoes>
      )}
    </tr>
  );
}
