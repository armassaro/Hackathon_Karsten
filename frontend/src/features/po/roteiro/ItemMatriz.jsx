import { min4 } from '../../../lib/fmt.js';

/** Elemento da matriz: clicável (seleção), arrastável e com botão ＋ para adicionar ao fim. */
export function ItemMatriz({ elemento: e, selecionado, aoClicar, aoIniciarArraste, aoTerminarArraste, aoAdicionar }) {
  return (
    <li draggable role="option" aria-selected={selecionado}
      onClick={aoClicar}
      onDragStart={(ev) => { ev.dataTransfer.effectAllowed = 'copy'; aoIniciarArraste(); }}
      onDragEnd={aoTerminarArraste}
      className={`group flex cursor-grab items-center gap-2 rounded-md border px-2.5 py-2 text-sm select-none active:cursor-grabbing ${selecionado ? 'border-accent bg-accent-soft' : 'border-line bg-white hover:border-accent/40 hover:bg-accent-soft/50'}`}>
      <span className="num w-9 shrink-0 font-semibold text-accent">{e.codigo}</span>
      <span className="min-w-0 flex-1 truncate" title={e.descricao}>{e.descricao}</span>
      <span className="num shrink-0 text-[12px] text-ink-3">{min4(e.tempo_min)}</span>
      <button onClick={(ev) => { ev.stopPropagation(); aoAdicionar(); }} className="shrink-0 rounded px-1.5 text-accent hover:bg-accent hover:text-white" aria-label={`Adicionar ${e.codigo}`}>＋</button>
    </li>
  );
}
