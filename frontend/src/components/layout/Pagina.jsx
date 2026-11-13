import { CabecalhoPagina } from './CabecalhoPagina.jsx';

/** Coluna padrão das páginas: cabeçalho + conteúdo empilhados. */
export function Pagina({ titulo, sub, acao, children }) {
  return (
    <div className="flex flex-col gap-5">
      <CabecalhoPagina titulo={titulo} sub={sub} acao={acao} />
      {children}
    </div>
  );
}
