import { useEffect, useState } from 'react';
import { api } from './api.js';
import { PAPEL_ROTULO } from './fmt.js';
import Login, { Logo } from './pages/Login.jsx';
import GerarPO from './pages/GerarPO.jsx';
import { Elementos, Maquinas } from './pages/Cadastros.jsx';
import Admin from './pages/Admin.jsx';
import { Selo } from './components/ui.jsx';

const PAGINAS = [
  { id: 'po', rotulo: 'Gerar PO', papel: 'engenheiro', Comp: GerarPO },
  { id: 'maquinas', rotulo: 'Máquinas', papel: 'leitor', Comp: Maquinas },
  { id: 'mtm', rotulo: 'Elementos MTM', papel: 'leitor', Comp: Elementos },
  { id: 'admin', rotulo: 'Administração', papel: 'admin', Comp: Admin },
];
const NIVEL = { leitor: 0, engenheiro: 1, admin: 2 };

const paginaDoHash = () => window.location.hash.replace('#/', '') || 'po';

export default function App() {
  const [sessao, setSessao] = useState(undefined); // undefined = verificando; null = deslogado
  const [pagina, setPagina] = useState(paginaDoHash());

  useEffect(() => {
    api.get('/auth/eu').then((r) => setSessao({ usuario: r.usuario, modo: r.modo })).catch(() => setSessao(null));
    const expirou = () => setSessao(null);
    const hash = () => setPagina(paginaDoHash());
    window.addEventListener('sessao-expirada', expirou);
    window.addEventListener('hashchange', hash);
    return () => { window.removeEventListener('sessao-expirada', expirou); window.removeEventListener('hashchange', hash); };
  }, []);

  if (sessao === undefined) return <div className="flex h-full items-center justify-center text-sm text-ink-3">Carregando…</div>;
  if (sessao === null) return <Login aoEntrar={() => api.get('/auth/eu').then((r) => setSessao({ usuario: r.usuario, modo: r.modo }))} />;

  const { usuario, modo } = sessao;
  const permitidas = PAGINAS.filter((p) => NIVEL[usuario.papel] >= NIVEL[p.papel]);
  const atual = permitidas.find((p) => p.id === pagina) ?? permitidas[0];
  const sair = async () => { await api.post('/auth/logout').catch(() => {}); setSessao(null); };

  return (
    <div className="min-h-full">
      <header className="no-print sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1480px] items-center gap-6 px-4 sm:px-6">
          <a href="#/po" className="flex items-center gap-2.5"><Logo escuro /><span className="font-semibold tracking-tight">Auto-T&amp;M</span></a>
          <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
            {permitidas.map((p) => (
              <a key={p.id} href={`#/${p.id}`} aria-current={atual.id === p.id ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 font-medium whitespace-nowrap ${atual.id === p.id ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-paper'}`}>{p.rotulo}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Selo tom={modo === 'google' ? 'ok' : 'warn'}>{modo === 'google' ? '● Google Sheets' : '● modo local'}</Selo>
            <div className="hidden text-right leading-tight md:block">
              <p className="text-[13px] font-medium">{usuario.nome}</p>
              <p className="text-[11.5px] text-ink-3">{PAPEL_ROTULO[usuario.papel]}</p>
            </div>
            <button onClick={sair} className="rounded-md px-2.5 py-1.5 text-sm text-ink-2 hover:bg-paper">Sair</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6">
        <atual.Comp usuario={usuario} modo={modo} />
      </main>
    </div>
  );
}
