/** Título da página, subtítulo e ações à direita. */
export function CabecalhoPagina({ titulo, sub, acao }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-semibold">{titulo}</h1>{sub && <p className="text-sm text-ink-3">{sub}</p>}</div>
      {acao}
    </div>
  );
}
