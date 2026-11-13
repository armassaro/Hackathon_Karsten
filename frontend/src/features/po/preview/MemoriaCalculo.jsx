import { dec, min4 } from '../../../lib/fmt.js';

/** Explica de onde vem o TP: FIXO (perímetro × tempo/metro) + Σ MTM (tempo × frequência). */
export function MemoriaCalculo({ po }) {
  const fixo = po.linhas[0];
  const mtm = po.linhas.slice(1);
  const parcelasMtm = mtm.map((l) => (l.frequencia !== 1 ? `${min4(l.tempo_min)}×${l.frequencia}` : min4(l.tempo_min))).join(' + ') || '0';
  const somaMtm = mtm.reduce((s, l) => s + l.tempo_min * l.frequencia, 0);
  return (
    <details className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink-2" open>
      <summary className="cursor-pointer font-medium text-ink">Memória de cálculo</summary>
      <div className="num mt-2 flex flex-col gap-1">
        <span>FIXO = {dec(po.cabecalho.perimetro_m)} m × {dec(po.equipamento.tempo_por_metro, 4)} min/m = <b>{min4(fixo.tempo_min)}</b></span>
        <span>MTM  = {parcelasMtm} = <b>{min4(somaMtm)}</b></span>
        <span>TP   = FIXO + MTM = <b className="text-accent">{min4(po.tp_min)} min</b></span>
      </div>
    </details>
  );
}
