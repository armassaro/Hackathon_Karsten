import { useRecurso } from '../../hooks/useRecurso.js';
import { dataHora } from '../../lib/fmt.js';
import { Botao, Cartao, Selo, Tabela } from '../../components/ui/index.js';
import { EstadoLista } from '../cadastros/index.js';

const LIMITE = 200;
const COLUNAS = [{ rotulo: 'Quando', className: 'w-44' }, { rotulo: 'Quem' }, { rotulo: 'Ação' }, { rotulo: 'Detalhes' }];

/** Cor do selo de cada ação da trilha de auditoria. */
const tomDaAcao = (a) => (a === 'ACESSO_NEGADO' ? 'bad' : /LOGIN|CODIGO/.test(a) ? 'accent' : /PO_/.test(a) ? 'ok' : 'neutro');

export function Auditoria() {
  const [lista, carregar] = useRecurso(`/admin/log?limite=${LIMITE}`);
  return (
    <Cartao titulo={`Auditoria (últimos ${LIMITE} eventos)`} acao={<Botao tamanho="sm" variante="secundario" onClick={carregar}>Atualizar</Botao>} corpoClassName="p-0">
      <EstadoLista itens={lista} vazio="Sem eventos.">
        <Tabela colunas={COLUNAS}>
          {lista?.map((l, i) => <LinhaEvento key={i} evento={l} />)}
        </Tabela>
      </EstadoLista>
    </Cartao>
  );
}

function LinhaEvento({ evento: l }) {
  return (
    <tr>
      <td className="px-3 py-2 text-[13px] whitespace-nowrap text-ink-3">{dataHora(l.data)}</td>
      <td className="px-3 py-2 text-[13px]">{l.email}</td>
      <td className="px-3 py-2"><Selo tom={tomDaAcao(l.acao)}>{l.acao}</Selo></td>
      <td className="num max-w-[420px] truncate px-3 py-2 text-[12px] text-ink-3" title={l.detalhes}>{l.detalhes}</td>
    </tr>
  );
}
