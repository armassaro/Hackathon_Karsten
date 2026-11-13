import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../lib/cx.js';
import { useCliqueFora } from '../../hooks/useCliqueFora.js';
import { usePosicaoFlutuante } from '../../hooks/usePosicaoFlutuante.js';
import { Contador } from './Contador.jsx';
import { estiloEntrada } from './Entrada.jsx';
import { SetaExpandir } from './Icones.jsx';

const ALTURA_PAINEL = 300;

/**
 * Seleção múltipla em lista suspensa com busca. O painel é renderizado num portal com posição fixa,
 * então nunca muda o tamanho nem é cortado pelo container pai.
 * opcoes: [{ valor, rotulo }]; selecionados: valores; nenhum selecionado = sem filtro.
 */
export function ListaBuscavel({ opcoes, selecionados, aoMudar, rotulo, placeholder = 'Todos' }) {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState('');
  const [destaque, setDestaque] = useState(0);
  const gatilho = useRef(null);
  const painel = useRef(null);
  const idLista = useId();
  const pos = usePosicaoFlutuante(gatilho, { ativo: aberta, altura: ALTURA_PAINEL });

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? opcoes.filter((o) => String(o.rotulo).toLowerCase().includes(q)) : opcoes;
  }, [opcoes, busca]);

  const sel = new Set(selecionados);
  const alternar = (v) => aoMudar(sel.has(v) ? selecionados.filter((x) => x !== v) : [...selecionados, v]);
  const fechar = (devolverFoco = true) => { setAberta(false); setBusca(''); if (devolverFoco) gatilho.current?.focus(); };

  useCliqueFora([painel, gatilho], () => fechar(false), aberta);
  useEffect(() => { setDestaque(0); }, [busca]);
  useEffect(() => { painel.current?.querySelector(`[data-indice="${destaque}"]`)?.scrollIntoView({ block: 'nearest' }); }, [destaque]);

  function aoTeclar(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setDestaque((d) => Math.min(d + 1, filtradas.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setDestaque((d) => Math.max(d - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtradas[destaque]) alternar(filtradas[destaque].valor); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(); }
    else if (e.key === 'Tab') fechar(false);
  }

  const rotulos = opcoes.filter((o) => sel.has(o.valor)).map((o) => o.rotulo);
  const resumo = !rotulos.length ? placeholder : rotulos.length <= 2 ? rotulos.join(', ') : `${rotulos.length} selecionados`;
  const todasVisiveisMarcadas = filtradas.length > 0 && filtradas.every((o) => sel.has(o.valor));
  const marcarVisiveis = () => {
    const vis = new Set(filtradas.map((o) => o.valor));
    aoMudar(todasVisiveisMarcadas ? selecionados.filter((v) => !vis.has(v)) : [...new Set([...selecionados, ...vis])]);
  };

  return (
    <>
      <button ref={gatilho} type="button" aria-haspopup="listbox" aria-expanded={aberta} aria-label={`${rotulo}: ${resumo}`}
        onClick={() => (aberta ? fechar() : setAberta(true))}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !aberta) { e.preventDefault(); setAberta(true); } }}
        className={cx(estiloEntrada, 'flex items-center gap-2 text-left', aberta && 'border-accent ring-2 ring-accent/20')}>
        <span className={cx('min-w-0 flex-1 truncate', !rotulos.length && 'text-ink-3')}>{resumo}</span>
        {rotulos.length > 0 && <Contador tom="suave">{rotulos.length}</Contador>}
        <SetaExpandir aberta={aberta} className="text-ink-3" />
      </button>

      {aberta && pos && createPortal(
        <div ref={painel} style={{ position: 'fixed', ...pos }}
          className="z-[70] flex max-h-[300px] flex-col overflow-hidden rounded-md border border-line-2 bg-card shadow-lg">
          <div className="border-b border-line p-2">
            <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={aoTeclar}
              role="combobox" aria-expanded="true" aria-controls={idLista} aria-activedescendant={filtradas[destaque] ? `${idLista}-${destaque}` : undefined}
              placeholder={`Buscar ${rotulo.toLowerCase()}…`} aria-label={`Buscar ${rotulo}`} className={cx(estiloEntrada, 'h-8 text-[13px]')} />
          </div>
          <ul id={idLista} role="listbox" aria-multiselectable="true" aria-label={rotulo} className="min-h-0 flex-1 overflow-y-auto py-1">
            {filtradas.map((o, i) => (
              <OpcaoMarcavel key={String(o.valor)} id={`${idLista}-${i}`} indice={i} rotulo={o.rotulo} marcada={sel.has(o.valor)} destacada={i === destaque}
                aoAlternar={() => alternar(o.valor)} aoPassar={() => setDestaque(i)} />
            ))}
            {!filtradas.length && <li className="px-3 py-4 text-center text-[13px] text-ink-3">Nada encontrado.</li>}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-line px-2 py-1.5 text-[12px]">
            <button type="button" disabled={!filtradas.length} className="rounded px-1.5 py-0.5 font-medium text-accent hover:bg-accent-soft disabled:opacity-40" onClick={marcarVisiveis}>
              {todasVisiveisMarcadas ? 'Desmarcar' : 'Marcar'} {busca ? 'encontrados' : 'todos'}
            </button>
            <button type="button" disabled={!selecionados.length} className="rounded px-1.5 py-0.5 text-ink-2 hover:bg-paper disabled:opacity-40" onClick={() => aoMudar([])}>Limpar</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** Item da lista com caixa de marcação. */
function OpcaoMarcavel({ id, indice, rotulo, marcada, destacada, aoAlternar, aoPassar }) {
  return (
    <li id={id} data-indice={indice} role="option" aria-selected={marcada}
      onPointerDown={(e) => e.preventDefault() /* mantém o foco na busca */}
      onClick={aoAlternar} onMouseMove={aoPassar}
      className={cx('flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px]', destacada && 'bg-paper', marcada ? 'text-accent' : 'text-ink')}>
      <span className={cx('flex size-4 shrink-0 items-center justify-center rounded border text-[10px] text-white',
        marcada ? 'border-accent bg-accent' : 'border-line-2 bg-white')} aria-hidden>{marcada && '✓'}</span>
      <span className="min-w-0 flex-1 truncate">{rotulo}</span>
    </li>
  );
}
