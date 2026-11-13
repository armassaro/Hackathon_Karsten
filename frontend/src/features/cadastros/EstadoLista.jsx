import { Carregando, Vazio } from '../../components/ui/index.js';

/**
 * Alterna entre "Carregando…" (itens === null), mensagem de vazio (sem itens) e o conteúdo.
 * Sem `vazio`, uma lista vazia mostra o conteúdo normalmente (ex.: tabela só com cabeçalho).
 */
export function EstadoLista({ itens, vazio, children }) {
  if (itens === null || itens === undefined) return <Carregando />;
  if (!itens.length && vazio) return <div className="p-4"><Vazio>{vazio}</Vazio></div>;
  return children;
}
