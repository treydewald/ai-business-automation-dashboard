import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-bold text-neon-text-secondary uppercase tracking-widest mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-lg border bg-neon-surface px-3 py-2.5 text-neon-text',
          'border-neon-divider placeholder-neon-text-secondary',
          'focus:border-neon-accent focus:outline-none focus:ring-1 focus:ring-neon-accent',
          'transition-all duration-200',
          error && 'border-neon-danger focus:ring-neon-danger',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-neon-danger">{error}</p>}
      {hint && !error && (
        <p className="mt-1 text-sm text-neon-text-secondary">{hint}</p>
      )}
    </div>
  );
}
