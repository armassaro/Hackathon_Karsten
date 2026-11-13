import { dataHora } from '../../../lib/fmt.js';
import { Botao, Tabela } from '../../../components/ui/index.js';
import { COLUNA_ACOES, CelulaAcoes } from '../../cadastros/index.js';
import { SeloPapel, SeloSituacao } from '../SeloPapel.jsx';

const COLUNAS = [{ rotulo: 'Nome' }, { rotulo: 'Prefixo' }, { rotulo: 'Papel' }, { rotulo: 'Criado em' }, { rotulo: 'Situação' }, COLUNA_ACOES];

export function TabelaTokens({ tokens, aoRevogar }) {
  return (
    <Tabela colunas={COLUNAS}>
      {tokens.map((t) => (
        <tr key={t.id} className={t.revogado ? 'text-ink-3' : ''}>
          <td className="px-3 py-2.5 font-medium">{t.nome}</td>
          <td className="num px-3 py-2.5">{t.prefixo}…</td>
          <td className="px-3 py-2.5"><SeloPapel papel={t.papel} /></td>
          <td className="px-3 py-2.5">{dataHora(t.criado_em)}</td>
          <td className="px-3 py-2.5"><SeloSituacao ativo={!t.revogado} inativo="revogado" tomInativo="bad" /></td>
          <CelulaAcoes className="px-3 py-1.5">{!t.revogado && <Botao tamanho="sm" variante="perigoSuave" onClick={() => aoRevogar(t)}>Revogar</Botao>}</CelulaAcoes>
        </tr>
      ))}
    </Tabela>
  );
}
