// Papéis de acesso: rótulos, hierarquia e cor do selo.
export const PAPEL_ROTULO = { admin: 'Administrador', engenheiro: 'Engenheiro', leitor: 'Leitor' };

/** Ordem crescente de permissão (igual ao backend). */
export const NIVEL_PAPEL = { leitor: 0, engenheiro: 1, admin: 2 };

/** Tom do <Selo> de cada papel. */
export const TOM_PAPEL = { admin: 'accent', engenheiro: 'ok', leitor: 'neutro' };

/** O papel `papel` alcança o mínimo exigido? */
export const temPapel = (papel, minimo) => NIVEL_PAPEL[papel] >= NIVEL_PAPEL[minimo];
