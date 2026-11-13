/** Mensagem de "nada aqui" com borda tracejada. */
export function Vazio({ children }) {
  return <div className="rounded-md border border-dashed border-line-2 px-4 py-8 text-center text-sm text-ink-3">{children}</div>;
}
