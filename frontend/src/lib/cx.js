/** Junta classes CSS ignorando valores falsos: cx('a', cond && 'b'). */
export const cx = (...c) => c.filter(Boolean).join(' ');
