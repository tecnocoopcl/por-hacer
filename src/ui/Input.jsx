export function Input({ className = '', onKeyDown, clearOnEscape = false, onChange, ...props }) {
  const handleKeyDown = (e) => {
    if (clearOnEscape && e.key === 'Escape') {
      onChange?.({ ...e, target: { ...e.target, value: '' } });
    }
    onKeyDown?.(e);
  };

  return (
    <input
      className={`ui-input ${className}`.trim()}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
