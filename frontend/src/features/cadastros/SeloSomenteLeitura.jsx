import { Selo } from '../../components/ui/index.js';

/** Indica que o usuário só pode consultar (não é admin). */
export function SeloSomenteLeitura() {
  return <Selo>Somente leitura</Selo>;
}
