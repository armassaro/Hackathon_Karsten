import { FichaPO } from './FichaPO.jsx';

/** Área usada só na impressão (@media print): uma ficha por bloco. */
export function AreaImpressao({ pos }) {
  return (
    <div className="print-only">
      {pos.map((po, i) => <div key={i} className="ficha-bloco"><FichaPO po={po} /></div>)}
    </div>
  );
}
