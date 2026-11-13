import { useState } from 'react';
import { api } from '../../../lib/api.js';
import { PAPEL_ROTULO } from '../../../lib/papeis.js';
import { useAvisar } from '../../../components/feedback/index.js';
import { Caixa, Campo, Entrada, ListaErros, ModalFormulario, SelecaoOpcoes } from '../../../components/ui/index.js';

/** Criar (inicial.novo) ou editar um usuário. Montado só enquanto aberto. */
export function ModalUsuario({ inicial, aoFechar, aoSalvar }) {
  const [form, setForm] = useState(inicial);
  const [erros, setErros] = useState([]);
  const avisar = useAvisar();
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function salvar(e) {
    e.preventDefault(); setErros([]);
    try { await api.post('/admin/usuarios', form); avisar('Usuário salvo. Mudanças de papel valem em até 30 s.'); aoFechar(); aoSalvar(); }
    catch (err) { setErros(err.erros?.length ? err.erros : [err.message]); }
  }

  return (
    <ModalFormulario aberto titulo={form.novo ? 'Novo usuário' : `Editar ${form.email}`} aoFechar={aoFechar} aoEnviar={salvar}>
      <Campo rotulo="E-mail corporativo"><Entrada type="email" value={form.email} disabled={!form.novo} onChange={set('email')} /></Campo>
      <Campo rotulo="Nome"><Entrada value={form.nome} onChange={set('nome')} /></Campo>
      <Campo rotulo="Papel"><SelecaoOpcoes value={form.papel} onChange={set('papel')} opcoes={PAPEL_ROTULO} /></Campo>
      <Caixa rotulo="Ativo (pode entrar no sistema)" checked={form.ativo} onChange={set('ativo')} />
      <ListaErros erros={erros} />
    </ModalFormulario>
  );
}
