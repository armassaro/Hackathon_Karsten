import { Botao } from '../../components/ui/index.js';

/** Célula de ações de uma linha de tabela (largura mínima, sem quebra). */
export function CelulaAcoes({ className = 'px-3 py-1.5 whitespace-nowrap', children }) {
  return <td className={className}>{children}</td>;
}

/** Botão "✏ Editar" de linha. */
export function BotaoEditar({ onClick, rotulo }) {
  return <Botao tamanho="sm" variante="fantasma" onClick={onClick} aria-label={rotulo}>✏ Editar</Botao>;
}

/** Botão de lixeira (remover/desativar) de linha. */
export function BotaoRemover({ onClick, rotulo }) {
  return <Botao tamanho="sm" variante="perigoSuave" onClick={onClick} aria-label={rotulo}>🗑</Botao>;
}

/** Coluna vazia e estreita onde ficam as ações (para o cabeçalho da <Tabela>). */
export const COLUNA_ACOES = { rotulo: '', chave: 'acoes', className: 'w-1' };
