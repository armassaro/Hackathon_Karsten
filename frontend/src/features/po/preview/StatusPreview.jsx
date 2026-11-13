import { min4 } from '../../../lib/fmt.js';
import { Selo } from '../../../components/ui/index.js';

/** Título "Ficha PO" com o selo do estado do cálculo. */
export function StatusPreview({ preview }) {
  return (
    <span className="flex items-center gap-2">Ficha PO
      {preview.estado === 'calculando' && <Selo>calculando…</Selo>}
      {preview.estado === 'desatualizada' && <Selo tom="warn">desatualizada</Selo>}
      {preview.estado === 'erro' && <Selo tom="bad">{preview.erros.length} pendência(s)</Selo>}</span>
  );
}

/** Tempo padrão total em destaque. */
export function TotalTP({ tp }) {
  return <span className="text-right"><span className="block text-[11px] font-semibold tracking-wide text-ink-3 uppercase">TP</span><span className="num text-lg font-semibold text-accent">{min4(tp)} min</span></span>;
}
