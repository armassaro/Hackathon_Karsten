import { useState } from 'react';
import { Botao, Entrada } from '../../../components/ui/index.js';
import { lerCodigos } from '../demanda.js';

/** Digitação rápida do roteiro ("2.1, 1.1x2, 3.1"); substitui a sequência inteira. */
export function FormCodigos({ aoAplicar }) {
  const [codigos, setCodigos] = useState('');
  const enviar = (e) => {
    e.preventDefault();
    const r = lerCodigos(codigos);
    if (r.length) { aoAplicar(r); setCodigos(''); }
  };
  return (
    <form className="mt-3 flex gap-2" onSubmit={enviar}>
      <Entrada value={codigos} onChange={(e) => setCodigos(e.target.value)} placeholder="Digitar códigos: 2.1, 1.1, 3.1 (aceita 2.1x2)" className="num" aria-label="Digitar códigos MTM" />
      <Botao variante="secundario" type="submit" disabled={!codigos.trim()}>Aplicar</Botao>
    </form>
  );
}
