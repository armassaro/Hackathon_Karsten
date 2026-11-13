/** Linha de traço azul que indica onde o item arrastado vai cair. */
const IndicadorSoltar = ({ posicao }) => (
  <span className={`absolute right-0 left-0 h-[3px] rounded bg-accent ${posicao === 'acima' ? '-top-[3px]' : '-bottom-[3px]'}`} />
);

/**
 * Um passo da sequência: alça de arraste, posição, código, descrição, frequência e botões ↑ ↓ ✕.
 * elemento = registro MTM do código (undefined se o código não existe na matriz).
 * indicador: null | 'acima' | 'abaixo' (onde mostrar a marca de soltar).
 */
export function ItemRoteiro({ passo: p, indice, elemento: el, primeiro, ultimo, indicador,
  aoIniciarArraste, aoTerminarArraste, aoArrastarSobre, aoSoltar, aoMudarFrequencia, aoSubir, aoDescer, aoRemover }) {
  return (
    <li draggable onDragStart={aoIniciarArraste} onDragEnd={aoTerminarArraste}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); aoArrastarSobre(e.clientY < r.top + r.height / 2 ? indice : indice + 1); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); aoSoltar(); }}
      className={`relative flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 text-sm ${el ? 'border-line' : 'border-bad/40 bg-bad-soft'}`}>
      {indicador && <IndicadorSoltar posicao={indicador} />}
      <span className="cursor-grab px-0.5 text-ink-3 select-none" aria-hidden>⋮⋮</span>
      <span className="num w-5 text-right text-[12px] text-ink-3">{indice + 1}</span>
      <span className="num w-9 shrink-0 font-semibold text-accent">{p.codigo}</span>
      <span className="line-clamp-2 min-w-0 flex-1 leading-snug" title={el?.descricao}>{el?.descricao ?? 'código não existe na matriz'}</span>
      <label className="flex items-center gap-1 text-[12px] text-ink-3" title="Frequência">
        ×<input value={p.frequencia} inputMode="decimal" aria-label={`Frequência do elemento ${p.codigo}`}
          onChange={(e) => aoMudarFrequencia(e.target.value)}
          className="num h-7 w-11 rounded border border-line-2 px-1 text-center text-[13px] text-ink focus:border-accent focus:outline-none" />
      </label>
      <span className="flex shrink-0">
        <BotaoIcone onClick={aoSubir} disabled={primeiro} rotulo="Subir">↑</BotaoIcone>
        <BotaoIcone onClick={aoDescer} disabled={ultimo} rotulo="Descer">↓</BotaoIcone>
        <BotaoIcone onClick={aoRemover} rotulo="Remover" perigo>✕</BotaoIcone>
      </span>
    </li>
  );
}

function BotaoIcone({ onClick, disabled, rotulo, perigo = false, children }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={rotulo}
      className={perigo ? 'rounded px-1 text-ink-3 hover:bg-bad-soft hover:text-bad' : 'rounded px-1 text-ink-3 hover:bg-paper disabled:opacity-30'}>{children}</button>
  );
}
