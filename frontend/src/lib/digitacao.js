// Filtros de digitação para campos numéricos (aceitam também o texto parcial, como "2," ou "").

/** Dígitos com um separador decimal opcional (vírgula ou ponto). */
export const ehDecimalParcial = (texto) => /^\d*[.,]?\d*$/.test(texto);

/** Só dígitos. */
export const ehInteiroParcial = (texto) => /^\d*$/.test(texto);
