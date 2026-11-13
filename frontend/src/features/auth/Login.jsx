// Login sem senha em duas etapas: e-mail -> código de 6 dígitos.
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { Logo } from '../../components/layout/Logo.jsx';
import { PainelMarca } from './PainelMarca.jsx';
import { EtapaEmail } from './EtapaEmail.jsx';
import { EtapaCodigo } from './EtapaCodigo.jsx';

const VALIDADE_CODIGO_MS = 10 * 60_000;
const mensagemDe = (e) => e.erros?.[0] || e.message;

export default function Login({ aoEntrar }) {
  const [etapa, setEtapa] = useState('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [envio, setEnvio] = useState({ mensagem: '', codigoDev: '', expira: 0 });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function solicitar(e) {
    e?.preventDefault();
    setErro(''); setCarregando(true);
    try {
      const r = await api.post('/auth/solicitar-codigo', { email });
      setEnvio({ mensagem: r.mensagem, codigoDev: r.codigoDev || '', expira: Date.now() + VALIDADE_CODIGO_MS });
      setEtapa('codigo');
    } catch (e2) {
      setErro(mensagemDe(e2));
    } finally { setCarregando(false); }
  }

  async function verificar(e) {
    e.preventDefault();
    setErro(''); setCarregando(true);
    try {
      const r = await api.post('/auth/verificar-codigo', { email, codigo });
      aoEntrar(r.usuario);
    } catch (e2) {
      setErro(mensagemDe(e2));
      setCodigo('');
    } finally { setCarregando(false); }
  }

  const trocarEmail = () => { setEtapa('email'); setErro(''); setCodigo(''); };

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <PainelMarca />
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><Logo escuro /><span className="text-lg font-semibold">Auto-T&amp;M</span></div>
          {etapa === 'email'
            ? <EtapaEmail email={email} setEmail={setEmail} erro={erro} carregando={carregando} aoEnviar={solicitar} />
            : <EtapaCodigo email={email} codigo={codigo} setCodigo={setCodigo} envio={envio} erro={erro} carregando={carregando}
                aoEnviar={verificar} aoReenviar={solicitar} aoTrocarEmail={trocarEmail} />}
        </div>
      </main>
    </div>
  );
}
