// Componentes de filtro reutilizáveis: bloco com título, filtro de intervalo e filtro por lista buscável.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Intervalo, estiloEntrada } from './ui.jsx';

const cx = (...c) => c.filter(Boolean).join(' ');

// ---------- Utilitários de intervalo ----------
/** Recorta um intervalo guardado aos limites atuais; null = intervalo completo. */
export const recortar = (v, [lo, hi]) => (v ? [Math.max(lo, Math.min(v[0], hi)), Math.min(hi, Math.max(v[1], lo))] : [lo, hi]);
/** O intervalo cobre todos os limites (ou seja, não filtra nada)? */
export const ehTudo = (v, [lo, hi]) => v[0] <= lo && v[1] >= hi;

// ---------- Bloco com título ----------
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

// ---------- Filtro de intervalo ----------
/**
 * valor: null (sem filtro) ou [inicio, fim]. aoMudar devolve null quando o intervalo volta a cobrir
 * tudo, assim o filtro acompanha novos cadastros em vez de ficar preso aos limites antigos.
 */
export function FiltroIntervalo({ titulo, limites, valor, aoMudar, passo = 1, formatar = String, lerTexto = Number, acao }) {
  const [lo, hi] = limites;
  return (
    <BlocoFiltro titulo={titulo} dica={`${formatar(lo)} a ${formatar(hi)}`} acao={acao}>
      <Intervalo rotulo={titulo} min={lo} max={hi} passo={passo} formatar={formatar} lerTexto={lerTexto}
        valor={recortar(valor, limites)} aoMudar={(v) => aoMudar(ehTudo(v, limites) ? null : v)} />
    </BlocoFiltro>
  );
}

// ---------- Filtro por lista buscável ----------
export function FiltroLista({ titulo, opcoes, selecionados, aoMudar, acao, placeholder }) {
  return (
    <BlocoFiltro titulo={titulo} dica={selecionados.length ? `${selecionados.length} de ${opcoes.length}` : 'todos'} acao={acao}>
      <ListaBuscavel rotulo={titulo} opcoes={opcoes} selecionados={selecionados} aoMudar={aoMudar} placeholder={placeholder} />
    </BlocoFiltro>
  );
}

/** Alternador segmentado (ex.: "Valores | Intervalo"). */
export function Alternador({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex rounded-md border border-line-2 bg-white p-0.5 text-[12px]">
      {opcoes.map(([v, r]) => (
        <button key={v} type="button" role="radio" aria-checked={valor === v} onClick={() => aoMudar(v)}
          className={cx('rounded px-2 py-0.5 font-medium', valor === v ? 'bg-accent text-white' : 'text-ink-2 hover:bg-paper')}>{r}</button>
      ))}
    </div>
  );
}

/**
 * Seleção múltipla em lista suspensa com busca. O painel é renderizado num portal com posição fixa,
 * então nunca muda o tamanho nem é cortado pelo container pai.
 * opcoes: [{ valor, rotulo }]; selecionados: valores; nenhum selecionado = sem filtro.
 */
export function ListaBuscavel({ opcoes, selecionados, aoMudar, rotulo, placeholder = 'Todos' }) {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState('');
  const [destaque, setDestaque] = useState(0);
  const [pos, setPos] = useState(null);
  const gatilho = useRef(null);
  const painel = useRef(null);
  const idLista = useId();

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? opcoes.filter((o) => String(o.rotulo).toLowerCase().includes(q)) : opcoes;
  }, [opcoes, busca]);

  const sel = new Set(selecionados);
  const alternar = (v) => aoMudar(sel.has(v) ? selecionados.filter((x) => x !== v) : [...selecionados, v]);
  const fechar = (devolverFoco = true) => { setAberta(false); setBusca(''); if (devolverFoco) gatilho.current?.focus(); };

  // Posiciona o painel sob o gatilho (ou acima, se não couber) e acompanha rolagem/redimensionamento.
  useLayoutEffect(() => {
    if (!aberta) return;
    const posicionar = () => {
      const r = gatilho.current.getBoundingClientRect();
      const altura = 300;
      const abaixo = window.innerHeight - r.bottom >= altura || r.top < altura;
      const largura = Math.max(r.width, 240);
      setPos({ left: Math.min(r.left, window.innerWidth - largura - 8), width: largura, ...(abaixo ? { top: r.bottom + 4 } : { bottom: window.innerHeight - r.top + 4 }) });
    };
    posicionar();
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    return () => { window.removeEventListener('resize', posicionar); window.removeEventListener('scroll', posicionar, true); };
  }, [aberta]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberta) return;
    const fora = (e) => { if (!painel.current?.contains(e.target) && !gatilho.current?.contains(e.target)) fechar(false); };
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, [aberta]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <>
      <button ref={gatilho} type="button" aria-haspopup="listbox" aria-expanded={aberta} aria-label={`${rotulo}: ${resumo}`}
        onClick={() => (aberta ? fechar() : setAberta(true))}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !aberta) { e.preventDefault(); setAberta(true); } }}
        className={cx(estiloEntrada, 'flex items-center gap-2 text-left', aberta && 'border-accent ring-2 ring-accent/20')}>
        <span className={cx('min-w-0 flex-1 truncate', !rotulos.length && 'text-ink-3')}>{resumo}</span>
        {rotulos.length > 0 && <span className="num rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-accent">{rotulos.length}</span>}
        <span className={cx('text-[10px] text-ink-3 transition-transform', aberta && 'rotate-180')} aria-hidden>▼</span>
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
            {filtradas.map((o, i) => {
              const marcado = sel.has(o.valor);
              return (
                <li key={String(o.valor)} id={`${idLista}-${i}`} data-indice={i} role="option" aria-selected={marcado}
                  onPointerDown={(e) => e.preventDefault() /* mantém o foco na busca */}
                  onClick={() => alternar(o.valor)} onMouseMove={() => setDestaque(i)}
                  className={cx('flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px]', i === destaque && 'bg-paper', marcado ? 'text-accent' : 'text-ink')}>
                  <span className={cx('flex size-4 shrink-0 items-center justify-center rounded border text-[10px] text-white',
                    marcado ? 'border-accent bg-accent' : 'border-line-2 bg-white')} aria-hidden>{marcado && '✓'}</span>
                  <span className="min-w-0 flex-1 truncate">{o.rotulo}</span>
                </li>
              );
            })}
            {!filtradas.length && <li className="px-3 py-4 text-center text-[13px] text-ink-3">Nada encontrado.</li>}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-line px-2 py-1.5 text-[12px]">
            <button type="button" disabled={!filtradas.length} className="rounded px-1.5 py-0.5 font-medium text-accent hover:bg-accent-soft disabled:opacity-40"
              onClick={() => {
                const vis = new Set(filtradas.map((o) => o.valor));
                aoMudar(todasVisiveisMarcadas ? selecionados.filter((v) => !vis.has(v)) : [...new Set([...selecionados, ...vis])]);
              }}>
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
