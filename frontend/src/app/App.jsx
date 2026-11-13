// Raiz da aplicação: verifica a sessão, mostra o login ou o layout com a página da rota atual.
import { useRotaHash } from '../hooks/useRotaHash.js';
import { useSessao } from '../hooks/useSessao.js';
import Login from '../features/auth/Login.jsx';
import { BarraSuperior } from './BarraSuperior.jsx';
import { PAGINA_INICIAL, paginasDoPapel } from './paginas.js';

export default function App() {
  const { sessao, aoEntrar, sair } = useSessao();
  const rota = useRotaHash(PAGINA_INICIAL);

  if (sessao === undefined) return <TelaCarregando />;
  if (sessao === null) return <Login aoEntrar={aoEntrar} />;

  const { usuario, modo } = sessao;
  const permitidas = paginasDoPapel(usuario.papel);
  const atual = permitidas.find((p) => p.id === rota) ?? permitidas[0];

  return (
    <div className="min-h-full">
      <BarraSuperior paginas={permitidas} atual={atual.id} usuario={usuario} modo={modo} aoSair={sair} />
      <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6">
        <atual.Comp usuario={usuario} modo={modo} />
      </main>
    </div>
  );
}

function TelaCarregando() {
  return <div className="flex h-full items-center justify-center text-sm text-ink-3">Carregando…</div>;
}
