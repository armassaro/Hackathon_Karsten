import { useState } from 'react';
import { useRecurso } from '../../../hooks/useRecurso.js';
import { Botao, Cartao } from '../../../components/ui/index.js';
import { EstadoLista } from '../../cadastros/index.js';
import { LegendaPapeis } from './LegendaPapeis.jsx';
import { ModalUsuario } from './ModalUsuario.jsx';
import { TabelaUsuarios } from './TabelaUsuarios.jsx';

const NOVO_USUARIO = { email: '', nome: '', papel: 'engenheiro', ativo: true, novo: true };

/** Usuários autorizados: lista, criação e edição de papel/situação. eu = usuário logado. */
export function Usuarios({ eu }) {
  const [lista, carregar] = useRecurso('/admin/usuarios');
  const [inicial, setInicial] = useState(null); // usuário em edição (ou NOVO_USUARIO); null = modal fechado

  return (
    <Cartao titulo="Usuários autorizados" acao={<Botao tamanho="sm" onClick={() => setInicial({ ...NOVO_USUARIO })}>+ Novo usuário</Botao>} corpoClassName="p-0">
      <EstadoLista itens={lista}>
        <TabelaUsuarios usuarios={lista} eu={eu} aoEditar={(u) => setInicial({ ...u })} />
      </EstadoLista>
      <LegendaPapeis />
      {inicial && <ModalUsuario inicial={inicial} aoFechar={() => setInicial(null)} aoSalvar={carregar} />}
    </Cartao>
  );
}
