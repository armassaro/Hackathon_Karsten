import { useRef, useState } from 'react';
import { cx } from '../../lib/cx.js';
import { ajustarAoPasso } from '../../lib/intervalo.js';
import { CampoNumero } from './CampoNumero.jsx';

/**
 * Slider de intervalo com dois marcadores, feito à mão (pointer events + teclado).
 * valor = [inicio, fim]; aoMudar recebe o novo par. Abaixo, dois campos editáveis.
 */
export function Intervalo({ min, max, passo = 1, valor, aoMudar, formatar = String, lerTexto = Number, rotulo = 'intervalo' }) {
  const trilho = useRef(null);
  const [ativo, setAtivo] = useState(null); // 0 | 1 | null
  const [a, b] = valor;
  const travado = !(max > min);
  const pct = (v) => (travado ? 0 : ((v - min) / (max - min)) * 100);
  const ajustar = (v) => ajustarAoPasso(v, min, max, passo);

  const mover = (i, v) => {
    const n = i === 0 ? [Math.min(ajustar(v), b), b] : [a, Math.max(ajustar(v), a)];
    if (n[0] !== a || n[1] !== b) aoMudar(n);
  };
  const valorNoPonto = (clientX) => {
    const r = trilho.current.getBoundingClientRect();
    return min + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * (max - min);
  };

  function aoPressionar(e) {
    if (travado || e.button !== 0) return;
    e.preventDefault();
    const v = valorNoPonto(e.clientX);
    // Escolhe o marcador mais próximo; se estiverem juntos, decide pelo lado do clique.
    const i = v < a ? 0 : v > b ? 1 : (v - a <= b - v ? 0 : 1);
    setAtivo(i);
    trilho.current.setPointerCapture(e.pointerId);
    trilho.current.querySelectorAll('[role="slider"]')[i]?.focus();
    mover(i, v);
  }
  const aoArrastar = (e) => { if (ativo !== null) mover(ativo, valorNoPonto(e.clientX)); };
  const aoSoltar = () => setAtivo(null);

  function aoTeclar(i, e) {
    const atual = i === 0 ? a : b;
    const grande = Math.max(passo, (max - min) / 10);
    const mapa = { ArrowLeft: -passo, ArrowDown: -passo, ArrowRight: passo, ArrowUp: passo, PageDown: -grande, PageUp: grande };
    if (e.key in mapa) mover(i, atual + mapa[e.key]);
    else if (e.key === 'Home') mover(i, i === 0 ? min : a);
    else if (e.key === 'End') mover(i, i === 0 ? b : max);
    else return;
    e.preventDefault();
  }

  return (
    <div className={cx('flex flex-col gap-2', travado && 'opacity-60')}>
      <div ref={trilho} onPointerDown={aoPressionar} onPointerMove={aoArrastar} onPointerUp={aoSoltar} onPointerCancel={aoSoltar}
        className={cx('relative mx-2 h-5 touch-none select-none', travado ? 'cursor-not-allowed' : 'cursor-pointer')}>
        <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent" style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%` }} />
        {[a, b].map((v, i) => (
          <Marcador key={i} indice={i} valor={v} pct={pct(v)} ativo={ativo === i} travado={travado} rotulo={rotulo} formatar={formatar}
            limites={i === 0 ? [min, b] : [a, max]} aoTeclar={(e) => aoTeclar(i, e)}
            // Se os dois se sobrepõem no fim do trilho, o mínimo fica por cima para continuar arrastável.
            zIndex={i === 0 && a === max ? 2 : 1} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <CampoNumero valor={a} formatar={formatar} lerTexto={lerTexto} rotulo={`${rotulo} mínimo`} disabled={travado} aoConfirmar={(v) => mover(0, v)} />
        <span className="text-ink-3">–</span>
        <CampoNumero valor={b} formatar={formatar} lerTexto={lerTexto} rotulo={`${rotulo} máximo`} disabled={travado} aoConfirmar={(v) => mover(1, v)} />
      </div>
    </div>
  );
}

/** Um dos dois marcadores (role="slider") do Intervalo. */
function Marcador({ indice, valor, pct, ativo, travado, rotulo, formatar, limites: [vmin, vmax], aoTeclar, zIndex }) {
  return (
    <span role="slider" tabIndex={travado ? -1 : 0} aria-label={`${rotulo}: ${indice === 0 ? 'mínimo' : 'máximo'}`}
      aria-valuemin={vmin} aria-valuemax={vmax} aria-valuenow={valor} aria-valuetext={formatar(valor)} aria-disabled={travado}
      onKeyDown={aoTeclar}
      className={cx('absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-white shadow-sm transition-[box-shadow,transform]',
        'hover:ring-4 hover:ring-accent/15 focus-visible:ring-4 focus-visible:ring-accent/25 focus-visible:outline-none',
        ativo && 'scale-110 ring-4 ring-accent/25')}
      style={{ left: `${pct}%`, zIndex }} />
  );
}
