import { useState } from 'react';
import { api } from '../../../lib/api.js';
import { useRecurso } from '../../../hooks/useRecurso.js';
import { Botao, Cartao, NotaCartao } from '../../../components/ui/index.js';
import { EstadoLista, useAcaoApi } from '../../cadastros/index.js';
import { ModalNovoToken } from './ModalNovoToken.jsx';
import { ModalTokenCriado } from './ModalTokenCriado.jsx';
import { TabelaTokens } from './TabelaTokens.jsx';

/** Tokens de API para automações: emitir (o valor aparece uma única vez) e revogar. */
export function Tokens() {
  const [lista, carregar] = useRecurso('/admin/tokens');
  const [criando, setCriando] = useState(false);
  const [criado, setCriado] = useState(null);
  const acao = useAcaoApi();

  const revogar = (t) => acao({
    confirmar: { titulo: `Revogar "${t.nome}"?`, perigo: true, confirmar: 'Revogar', mensagem: 'Integrações que usam este token param de funcionar imediatamente.' },
    chamar: () => api.del(`/admin/tokens/${t.id}`), sucesso: 'Token revogado.', depois: carregar,
  });

  return (
    <Cartao titulo="Tokens de API" acao={<Botao tamanho="sm" onClick={() => setCriando(true)}>+ Novo token</Botao>} corpoClassName="p-0">
      <NotaCartao topo>Para automações (ex.: um script da Engenharia que gera POs em lote). Guardamos só o hash: o valor aparece uma única vez.</NotaCartao>
      <EstadoLista itens={lista} vazio="Nenhum token emitido.">
        <TabelaTokens tokens={lista} aoRevogar={revogar} />
      </EstadoLista>
      {criando && <ModalNovoToken aoFechar={() => setCriando(false)} aoCriar={(t) => { setCriando(false); setCriado(t); carregar(); }} />}
      <ModalTokenCriado token={criado} aoFechar={() => setCriado(null)} />
    </Cartao>
  );
}
