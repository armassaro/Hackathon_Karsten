import { useState } from 'react';
import { cx } from '../../lib/cx.js';
import { estiloEntrada } from './Entrada.jsx';

/**
 * Campo numérico que só aplica o valor ao sair do campo ou apertar Enter (Esc descarta).
 * formatar: número -> texto exibido; lerTexto: texto digitado -> número.
 */
export function CampoNumero({ valor, formatar = String, lerTexto = Number, aoConfirmar, rotulo, disabled, className = 'num h-8 min-w-0 flex-1 px-2 text-center text-[13px]' }) {
  const [texto, setTexto] = useState(null); // null = mostrando o valor externo
  const confirmar = () => {
    if (texto === null) return;
    const v = lerTexto(texto);
    if (Number.isFinite(v)) aoConfirmar(v);
    setTexto(null);
  };
  return (
    <input value={texto ?? formatar(valor)} disabled={disabled} inputMode="decimal" aria-label={rotulo}
      onChange={(e) => setTexto(e.target.value)} onBlur={confirmar}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmar(); } if (e.key === 'Escape') setTexto(null); }}
      className={cx(estiloEntrada, className)} />
  );
}
