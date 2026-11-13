/** Resumo do que cada papel pode fazer (rodapé da lista de usuários). */
export function LegendaPapeis() {
  return (
    <div className="border-t border-line px-4 py-3 text-[13px] text-ink-3">
      <b>Leitor</b>: consulta máquinas e MTM · <b>Engenheiro</b>: + gera, exporta e recebe POs · <b>Administrador</b>: + cadastros, usuários e tokens.
    </div>
  );
}
