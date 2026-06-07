import type { HTMLAttributes } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  label?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Spinner({
  size = 'md',
  label = 'Loading...',
  className,
  ...props
}: SpinnerProps) {
  const classes = [
    sizes[size],
    'border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin',
    'dark:border-gray-600 dark:border-t-primary-500',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex items-center justify-center gap-2" {...props}>
      <div className={classes} role="status" aria-label={label} />
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      )}
    </div>
  );
}
