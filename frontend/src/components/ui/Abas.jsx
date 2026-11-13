const ESTILOS = {
  // Botões grandes ocupando a largura (ex.: Formulário | Importar arquivos).
  segmentado: {
    lista: 'flex gap-1 rounded-lg border border-line bg-card p-1 text-sm',
    aba: (ativa) => `flex-1 rounded-md px-3 py-2 font-medium transition-colors ${ativa ? 'bg-accent text-white' : 'text-ink-2 hover:bg-paper'}`,
  },
  // Abas sublinhadas sobre uma linha (ex.: Administração).
  sublinhado: {
    lista: 'flex gap-1 border-b border-line text-sm',
    aba: (ativa) => `-mb-px border-b-2 px-4 py-2 font-medium ${ativa ? 'border-accent text-accent' : 'border-transparent text-ink-3 hover:text-ink'}`,
  },
};

/** Barra de abas. abas: [[id, rótulo]]; valor = id ativo. estilo: segmentado | sublinhado. */
export function Abas({ abas, valor, aoMudar, estilo = 'segmentado', rotulo }) {
  const e = ESTILOS[estilo];
  return (
    <div role="tablist" aria-label={rotulo} className={e.lista}>
      {abas.map(([id, r]) => (
        <button key={id} type="button" role="tab" aria-selected={valor === id} onClick={() => aoMudar(id)} className={e.aba(valor === id)}>{r}</button>
      ))}
    </div>
  );
}
