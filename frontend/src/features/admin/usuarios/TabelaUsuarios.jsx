import { Tabela } from '../../../components/ui/index.js';
import { BotaoEditar, COLUNA_ACOES, CelulaAcoes } from '../../cadastros/index.js';
import { SeloPapel, SeloSituacao } from '../SeloPapel.jsx';

const COLUNAS = [{ rotulo: 'Nome' }, { rotulo: 'E-mail' }, { rotulo: 'Papel' }, { rotulo: 'Situação' }, COLUNA_ACOES];

export function TabelaUsuarios({ usuarios, eu, aoEditar }) {
  return (
    <Tabela colunas={COLUNAS}>
      {usuarios.map((u) => (
        <tr key={u.email}>
          <td className="px-3 py-2.5 font-medium">{u.nome} {u.email === eu.email && <span className="text-ink-3">(você)</span>}</td>
          <td className="px-3 py-2.5">{u.email}</td>
          <td className="px-3 py-2.5"><SeloPapel papel={u.papel} /></td>
          <td className="px-3 py-2.5"><SeloSituacao ativo={u.ativo} /></td>
          <CelulaAcoes className="px-3 py-1.5"><BotaoEditar onClick={() => aoEditar(u)} /></CelulaAcoes>
        </tr>
      ))}
    </Tabela>
  );
}
