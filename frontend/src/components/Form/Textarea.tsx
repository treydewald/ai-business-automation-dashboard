import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-bold text-neon-text-secondary uppercase tracking-widest mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={[
          'w-full rounded-lg border border-neon-divider bg-neon-surface px-3 py-2.5 text-neon-text',
          'placeholder-neon-text-secondary focus:border-neon-accent focus:outline-none focus:ring-1 focus:ring-neon-accent',
          'resize-none transition-all duration-200',
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
