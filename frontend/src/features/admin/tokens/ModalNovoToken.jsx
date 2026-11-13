import { useState } from 'react';
import { api } from '../../../lib/api.js';
import { useErroApi } from '../../../components/feedback/index.js';
import { Campo, Entrada, ModalFormulario, SelecaoOpcoes } from '../../../components/ui/index.js';

// Token nunca recebe papel de administrador.
const PAPEIS_TOKEN = [['engenheiro', 'Engenheiro'], ['leitor', 'Leitor']];

/** Formulário de emissão de token. aoCriar recebe o token criado (com o valor em claro). */
export function ModalNovoToken({ aoFechar, aoCriar }) {
  const [form, setForm] = useState({ nome: '', papel: 'engenheiro' });
  const erroApi = useErroApi();
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function criar(e) {
    e.preventDefault();
    try { aoCriar(await api.post('/admin/tokens', form)); } catch (err) { erroApi(err); }
  }

  return (
    <ModalFormulario aberto titulo="Novo token de API" aoFechar={aoFechar} aoEnviar={criar} rotuloEnviar="Gerar token">
      <Campo rotulo="Nome / finalidade"><Entrada value={form.nome} onChange={set('nome')} placeholder="Script de lote da Engenharia" /></Campo>
      <Campo rotulo="Papel"><SelecaoOpcoes value={form.papel} onChange={set('papel')} opcoes={PAPEIS_TOKEN} /></Campo>
    </ModalFormulario>
  );
}
