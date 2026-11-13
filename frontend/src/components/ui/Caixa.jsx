/** Checkbox com rótulo ao lado; demais props vão para o <input>. */
export function Caixa({ rotulo, className = 'flex items-center gap-2 text-sm', inputClassName, ...props }) {
  return (
    <label className={className}>
      <input type="checkbox" className={inputClassName} {...props} /> {rotulo}
    </label>
  );
}
