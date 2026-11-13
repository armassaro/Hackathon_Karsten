// Ícones SVG em linha (herdam a cor do texto via currentColor).
import { cx } from '../../lib/cx.js';

const traco = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', 'aria-hidden': true };

export const IconeBusca = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" {...traco}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

export const IconeFiltro = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" {...traco}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);

export const IconeEnviarArquivo = ({ className = 'text-accent' }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
    <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Triângulo ▼ que gira quando `aberta`. */
export const SetaExpandir = ({ aberta, className }) => (
  <span className={cx('text-[10px] transition-transform', className, aberta && 'rotate-180')} aria-hidden>▼</span>
);
