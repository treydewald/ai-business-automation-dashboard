import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Checkbox({
  label,
  error,
  className,
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={checkboxId}
        className={[
          'w-4 h-4 rounded border-gray-300 text-primary-600',
          'focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {label}
        </label>
      )}
      {error && <p className="text-sm text-error ml-auto">{error}</p>}
    </div>
  );
}
