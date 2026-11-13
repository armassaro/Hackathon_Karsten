import { ehTudo, recortar } from '../../lib/intervalo.js';
import { Intervalo } from '../ui/Intervalo.jsx';
import { BlocoFiltro } from './BlocoFiltro.jsx';

/**
 * valor: null (sem filtro) ou [inicio, fim]. aoMudar devolve null quando o intervalo volta a cobrir
 * tudo, assim o filtro acompanha novos cadastros em vez de ficar preso aos limites antigos.
 */
export function FiltroIntervalo({ titulo, limites, valor, aoMudar, passo = 1, formatar = String, lerTexto = Number, acao }) {
  const [lo, hi] = limites;
  return (
    <BlocoFiltro titulo={titulo} dica={`${formatar(lo)} a ${formatar(hi)}`} acao={acao}>
      <Intervalo rotulo={titulo} min={lo} max={hi} passo={passo} formatar={formatar} lerTexto={lerTexto}
        valor={recortar(valor, limites)} aoMudar={(v) => aoMudar(ehTudo(v, limites) ? null : v)} />
    </BlocoFiltro>
  );
}
