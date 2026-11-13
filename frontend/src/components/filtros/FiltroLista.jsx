import { ListaBuscavel } from '../ui/ListaBuscavel.jsx';
import { BlocoFiltro } from './BlocoFiltro.jsx';

/** Filtro por seleção múltipla numa lista buscável; nenhum selecionado = todos. */
export function FiltroLista({ titulo, opcoes, selecionados, aoMudar, acao, placeholder }) {
  return (
    <BlocoFiltro titulo={titulo} dica={selecionados.length ? `${selecionados.length} de ${opcoes.length}` : 'todos'} acao={acao}>
      <ListaBuscavel rotulo={titulo} opcoes={opcoes} selecionados={selecionados} aoMudar={aoMudar} placeholder={placeholder} />
    </BlocoFiltro>
  );
}
