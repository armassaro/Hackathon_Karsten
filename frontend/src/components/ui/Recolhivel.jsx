/** Conteúdo que abre/fecha com animação de altura (grid-rows 0fr -> 1fr). Fechado fica inerte (fora do Tab). */
export function Recolhivel({ id, aberto, children }) {
  return (
    <div id={id} inert={!aberto} className={`grid transition-[grid-template-rows] duration-200 ease-out ${aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
