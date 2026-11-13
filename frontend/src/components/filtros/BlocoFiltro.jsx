/** Agrupa um filtro com título (legend), dica opcional e uma ação à direita (ex.: um Alternador). */
export function BlocoFiltro({ titulo, dica, acao, children }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <legend className="truncate text-[12px] font-semibold tracking-wide text-ink-2 uppercase">{titulo}
          {dica && <span className="ml-2 font-normal tracking-normal text-ink-3 normal-case">{dica}</span>}</legend>
        {acao}
      </div>
      {children}
    </fieldset>
  );
}
