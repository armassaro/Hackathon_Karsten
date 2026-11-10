import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Botao, Campo, Entrada } from '../components/ui.jsx';

export default function Login({ aoEntrar }) {
  const [etapa, setEtapa] = useState('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [codigoDev, setCodigoDev] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [expira, setExpira] = useState(0);
  const [agora, setAgora] = useState(Date.now());
  const refCodigo = useRef(null);

  useEffect(() => {
    if (etapa !== 'codigo') return;
    refCodigo.current?.focus();
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [etapa]);

  const restante = Math.max(0, Math.round((expira - agora) / 1000));
  const mmss = `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}`;

  async function solicitar(e) {
    e?.preventDefault();
    setErro(''); setCarregando(true);
    try {
      const r = await api.post('/auth/solicitar-codigo', { email });
      setMensagem(r.mensagem);
      setCodigoDev(r.codigoDev || '');
      setExpira(Date.now() + 10 * 60_000);
      setAgora(Date.now());
      setEtapa('codigo');
    } catch (e2) {
      setErro(e2.erros?.[0] || e2.message);
    } finally { setCarregando(false); }
  }

  async function verificar(e) {
    e.preventDefault();
    setErro(''); setCarregando(true);
    try {
      const r = await api.post('/auth/verificar-codigo', { email, codigo });
      aoEntrar(r.usuario);
    } catch (e2) {
      setErro(e2.erros?.[0] || e2.message);
      setCodigo('');
    } finally { setCarregando(false); }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-accent-2 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Auto-T&amp;M</span>
        </div>
        <div className="max-w-md">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-white/60 uppercase">Engenharia de Tempos e Métodos</p>
          <h1 className="mt-3 text-[34px] leading-tight font-semibold">Da sequência de operações à Ficha PO em segundos.</h1>
          <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 font-mono text-[13px] text-white/85">
            <dt className="text-white/50">FIXO</dt><dd>perímetro (m) × tempo/metro da máquina</dd>
            <dt className="text-white/50">MTM</dt><dd>tempos consultados na matriz de elementos</dd>
            <dt className="text-white/50">TP</dt><dd>FIXO + Σ (tempo × frequência)</dd>
          </dl>
        </div>
        <p className="text-xs text-white/45">Hackathon Auto-T&amp;M · Karsten S.A.</p>
        <svg className="pointer-events-none absolute -right-24 -bottom-24 opacity-[0.07]" width="460" height="460" viewBox="0 0 100 100" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => <circle key={i} cx="50" cy="50" r={8 + i * 4} fill="none" stroke="white" strokeWidth="0.6" strokeDasharray="1.2 1.6" />)}
        </svg>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><Logo escuro /><span className="text-lg font-semibold">Auto-T&amp;M</span></div>
          {etapa === 'email' ? (
            <form onSubmit={solicitar} className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-semibold">Entrar</h2>
                <p className="mt-1 text-sm text-ink-3">Sem senha: enviamos um código de 6 dígitos para o seu e-mail corporativo.</p>
              </div>
              <Campo rotulo="E-mail corporativo">
                <Entrada type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com.br" />
              </Campo>
              {erro && <p className="text-sm text-bad">{erro}</p>}
              <Botao tamanho="lg" carregando={carregando} type="submit">Enviar código</Botao>
            </form>
          ) : (
            <form onSubmit={verificar} className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-semibold">Digite o código</h2>
                <p className="mt-1 text-sm text-ink-3">{mensagem}</p>
                <p className="mt-1 text-sm text-ink-2"><span className="font-medium">{email}</span> · <button type="button" className="text-accent hover:underline" onClick={() => { setEtapa('email'); setErro(''); setCodigo(''); }}>trocar</button></p>
              </div>
              {codigoDev && (
                <div className="rounded-md border border-warn/30 bg-warn-soft px-3 py-2 text-[13px] text-warn">
                  Modo ensaio local: seu código é <span className="num font-semibold">{codigoDev}</span>
                </div>
              )}
              <Campo rotulo="Código de acesso" dica={restante > 0 ? `Expira em ${mmss}` : 'Código expirado — peça outro.'}>
                <Entrada ref={refCodigo} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  className="num h-12 text-center text-2xl tracking-[0.5em]" placeholder="••••••" />
              </Campo>
              {erro && <p className="text-sm text-bad">{erro}</p>}
              <Botao tamanho="lg" carregando={carregando} type="submit" disabled={codigo.length !== 6}>Entrar</Botao>
              <Botao type="button" variante="fantasma" onClick={solicitar} disabled={carregando}>Reenviar código</Botao>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export function Logo({ escuro = false }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill={escuro ? '#1d4e73' : 'rgba(255,255,255,0.12)'} />
      <path d="M8 22 L14 10 L18 18 L21 13 L24 22" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
