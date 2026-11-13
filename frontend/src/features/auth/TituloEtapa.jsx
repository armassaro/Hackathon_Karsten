/** Título e texto de apoio de cada etapa do login. */
export function TituloEtapa({ titulo, children }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">{titulo}</h2>
      {children}
    </div>
  );
}

export function ErroLogin({ erro }) {
  return erro ? <p className="text-sm text-bad">{erro}</p> : null;
}
