import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-bold text-neon-text-secondary uppercase tracking-widest mb-2"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          'w-full rounded-lg border border-neon-divider bg-neon-surface px-3 py-2.5 text-neon-text',
          'focus:border-neon-accent focus:outline-none focus:ring-1 focus:ring-neon-accent',
          'transition-all duration-200 cursor-pointer',
          error && 'border-neon-danger focus:ring-neon-danger',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-neon-danger">{error}</p>}
    </div>
  );
}
