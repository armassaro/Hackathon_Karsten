// Ordenação genérica de listas por campo (números como números; texto em pt-BR com ordem natural).

/** ordem = { campo, asc }. Devolve uma cópia ordenada. */
export function ordenar(lista, { campo, asc }) {
  return [...lista].sort((a, b) => {
    const x = a[campo], y = b[campo];
    const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR', { numeric: true });
    return asc ? r : -r;
  });
}

/** Próxima ordem ao clicar no cabeçalho `campo`: mesmo campo inverte; outro campo começa crescente. */
export const alternarOrdem = (ordem, campo) => ({ campo, asc: ordem.campo === campo ? !ordem.asc : true });
