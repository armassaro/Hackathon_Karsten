// Administração: usuários e papéis, tokens de API e auditoria.
import { useState } from 'react';
import { Pagina } from '../../components/layout/index.js';
import { Abas } from '../../components/ui/index.js';
import { Usuarios } from './usuarios/Usuarios.jsx';
import { Tokens } from './tokens/Tokens.jsx';
import { Auditoria } from './Auditoria.jsx';

const ABAS = [['usuarios', 'Usuários'], ['tokens', 'Tokens de API'], ['log', 'Auditoria']];

export default function Admin({ usuario }) {
  const [aba, setAba] = useState('usuarios');
  return (
    <Pagina titulo="Administração" sub="Quem pode fazer o quê, integrações por token e trilha de auditoria.">
      <Abas estilo="sublinhado" rotulo="Seções da administração" abas={ABAS} valor={aba} aoMudar={setAba} />
      {aba === 'usuarios' && <Usuarios eu={usuario} />}
      {aba === 'tokens' && <Tokens />}
      {aba === 'log' && <Auditoria />}
    </Pagina>
  );
}
