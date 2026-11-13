import { PAPEL_ROTULO } from '../lib/papeis.js';
import { Logo } from '../components/layout/Logo.jsx';
import { Selo } from '../components/ui/Selo.jsx';

/** Cabeçalho fixo: marca, menu de páginas, modo de armazenamento, usuário e "Sair". */
export function BarraSuperior({ paginas, atual, usuario, modo, aoSair }) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-[1480px] items-center gap-6 px-4 sm:px-6">
        <a href={`#/${paginas[0]?.id ?? ''}`} className="flex items-center gap-2.5"><Logo escuro /><span className="font-semibold tracking-tight">Auto-T&amp;M</span></a>
        <Menu paginas={paginas} atual={atual} />
        <div className="flex items-center gap-3">
          <SeloModo modo={modo} />
          <IdentificacaoUsuario usuario={usuario} />
          <button onClick={aoSair} className="rounded-md px-2.5 py-1.5 text-sm text-ink-2 hover:bg-paper">Sair</button>
        </div>
      </div>
    </header>
  );
}

function Menu({ paginas, atual }) {
  return (
    <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
      {paginas.map((p) => (
        <a key={p.id} href={`#/${p.id}`} aria-current={atual === p.id ? 'page' : undefined}
          className={`rounded-md px-3 py-1.5 font-medium whitespace-nowrap ${atual === p.id ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-paper'}`}>{p.rotulo}</a>
      ))}
    </nav>
  );
}

function SeloModo({ modo }) {
  const google = modo === 'google';
  return <Selo tom={google ? 'ok' : 'warn'}>{google ? '● Google Sheets' : '● modo local'}</Selo>;
}

function IdentificacaoUsuario({ usuario }) {
  return (
    <div className="hidden text-right leading-tight md:block">
      <p className="text-[13px] font-medium">{usuario.nome}</p>
      <p className="text-[11.5px] text-ink-3">{PAPEL_ROTULO[usuario.papel]}</p>
    </div>
  );
}
