import { useRef, useState } from 'react';

/**
 * Seleção múltipla na matriz, como em gerenciadores de arquivos:
 * clique simples = só ele (de novo = desmarca); Ctrl/⌘ + clique = alterna; Shift + clique = intervalo a partir da âncora.
 * visiveis = códigos na ordem exibida; todos = códigos na ordem da matriz.
 */
export function useSelecaoMatriz(visiveis, todos) {
  const [selecao, setSelecao] = useState(() => new Set());
  const ancora = useRef(null); // último elemento clicado (base do Shift + clique)

  function clicar(e, codigo) {
    const multi = e.ctrlKey || e.metaKey;
    if (e.shiftKey && ancora.current && visiveis.includes(ancora.current)) {
      const a = visiveis.indexOf(ancora.current);
      const b = visiveis.indexOf(codigo);
      const intervalo = visiveis.slice(Math.min(a, b), Math.max(a, b) + 1);
      setSelecao((s) => (multi ? new Set([...s, ...intervalo]) : new Set(intervalo)));
      return; // a âncora se mantém
    }
    if (multi) setSelecao((s) => { const n = new Set(s); n.has(codigo) ? n.delete(codigo) : n.add(codigo); return n; });
    else setSelecao((s) => (s.size === 1 && s.has(codigo) ? new Set() : new Set([codigo])));
    ancora.current = codigo;
  }

  const limpar = () => { setSelecao(new Set()); ancora.current = null; };
  const selecionarVisiveis = () => setSelecao(new Set(visiveis));
  // Mantém a ordem da matriz ao adicionar/arrastar vários.
  const emOrdem = todos.filter((c) => selecao.has(c));

  return { selecao, clicar, limpar, selecionarVisiveis, emOrdem };
}
