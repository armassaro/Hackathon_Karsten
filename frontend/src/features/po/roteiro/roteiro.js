// Operações puras sobre a lista do roteiro (sem estado).
import { numeroDe } from '../../../lib/fmt.js';
import { novoPasso } from '../demanda.js';

/** Insere novos passos (códigos) na posição `pos`. */
export const inserirCodigos = (roteiro, codigos, pos = roteiro.length) =>
  [...roteiro.slice(0, pos), ...codigos.map((c) => novoPasso(c)), ...roteiro.slice(pos)];

/** Move o item de `de` para `para` (ignora destinos fora da lista). */
export function moverPasso(roteiro, de, para) {
  if (para < 0 || para >= roteiro.length) return roteiro;
  const c = [...roteiro]; const [x] = c.splice(de, 1); c.splice(para, 0, x); return c;
}

export const removerPasso = (roteiro, id) => roteiro.filter((x) => x.id !== id);
export const mudarFrequencia = (roteiro, id, frequencia) => roteiro.map((x) => (x.id === id ? { ...x, frequencia } : x));

/** Σ tempo × frequência dos elementos conhecidos. porCodigo = { codigo: elementoMTM }. */
export const tempoTotalMTM = (roteiro, porCodigo) =>
  roteiro.reduce((s, p) => s + (porCodigo[p.codigo]?.tempo_min ?? 0) * (numeroDe(p.frequencia) || 0), 0);
