import { PAPEL_ROTULO, TOM_PAPEL } from '../../lib/papeis.js';
import { Selo } from '../../components/ui/index.js';

/** Selo colorido com o nome do papel. */
export function SeloPapel({ papel }) {
  return <Selo tom={TOM_PAPEL[papel]}>{PAPEL_ROTULO[papel]}</Selo>;
}

/** Selo de situação: ativo (verde) ou o rótulo de inativo no tom indicado. */
export function SeloSituacao({ ativo, inativo = 'inativo', tomInativo = 'warn' }) {
  return ativo ? <Selo tom="ok">ativo</Selo> : <Selo tom={tomInativo}>{inativo}</Selo>;
}
