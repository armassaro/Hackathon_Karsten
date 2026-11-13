import { cx } from '../../lib/cx.js';
import { Girador } from './Girador.jsx';

const BASE = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent whitespace-nowrap';
const TAMANHOS = { sm: 'h-8 px-3 text-[13px]', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-[15px]' };
const VARIANTES = {
  primario: 'bg-accent text-white hover:bg-accent-2',
  secundario: 'bg-card text-ink border border-line-2 hover:bg-paper',
  fantasma: 'text-ink-2 hover:bg-black/5',
  perigo: 'bg-bad text-white hover:bg-[#912018]',
  perigoSuave: 'text-bad hover:bg-bad-soft',
};

/** Botão padrão. variante: primario | secundario | fantasma | perigo | perigoSuave; tamanho: sm | md | lg. */
export function Botao({ variante = 'primario', tamanho = 'md', carregando = false, className, children, ...props }) {
  return (
    <button className={cx(BASE, TAMANHOS[tamanho], VARIANTES[variante], className)} disabled={carregando || props.disabled} {...props}>
      {carregando && <Girador />}
      {children}
    </button>
  );
}
