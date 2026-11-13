import { RotuloSecao } from '../../../components/ui/index.js';

/** Título em caixa alta de uma coluna do montador, com ações à direita. */
export function CabecalhoColuna({ titulo, children }) {
  return (
    <div className="mb-2 flex min-h-7 items-center justify-between gap-2">
      <RotuloSecao>{titulo}</RotuloSecao>
      {children}
    </div>
  );
}
