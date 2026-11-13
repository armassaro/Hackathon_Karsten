/** Marca do Auto-T&M. `escuro` = fundo sólido (para usar sobre fundo claro). */
export function Logo({ escuro = false }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill={escuro ? '#1d4e73' : 'rgba(255,255,255,0.12)'} />
      <path d="M8 22 L14 10 L18 18 L21 13 L24 22" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
