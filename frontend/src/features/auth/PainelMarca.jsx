import { Logo } from '../../components/layout/Logo.jsx';

const FORMULAS = [
  ['FIXO', 'perímetro (m) × tempo/metro da máquina'],
  ['MTM', 'tempos consultados na matriz de elementos'],
  ['TP', 'FIXO + Σ (tempo × frequência)'],
];

/** Lateral azul da tela de login (só em telas largas). */
export function PainelMarca() {
  return (
    <aside className="relative hidden overflow-hidden bg-accent-2 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="text-lg font-semibold tracking-tight">Auto-T&amp;M</span>
      </div>
      <div className="max-w-md">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-white/60 uppercase">Engenharia de Tempos e Métodos</p>
        <h1 className="mt-3 text-[34px] leading-tight font-semibold">Da sequência de operações à Ficha PO em segundos.</h1>
        <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 font-mono text-[13px] text-white/85">
          {FORMULAS.map(([termo, def]) => [
            <dt key={`t${termo}`} className="text-white/50">{termo}</dt>,
            <dd key={`d${termo}`}>{def}</dd>,
          ])}
        </dl>
      </div>
      <p className="text-xs text-white/45">Hackathon Auto-T&amp;M · Karsten S.A.</p>
      <Ondas />
    </aside>
  );
}

/** Círculos concêntricos decorativos no canto. */
function Ondas() {
  return (
    <svg className="pointer-events-none absolute -right-24 -bottom-24 opacity-[0.07]" width="460" height="460" viewBox="0 0 100 100" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx="50" cy="50" r={8 + i * 4} fill="none" stroke="white" strokeWidth="0.6" strokeDasharray="1.2 1.6" />)}
    </svg>
  );
}
