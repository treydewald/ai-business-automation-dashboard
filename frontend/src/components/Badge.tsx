import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variants = {
  default:
    'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
  success:
    'bg-success bg-opacity-20 text-success dark:bg-opacity-30',
  warning:
    'bg-warning bg-opacity-20 text-warning dark:bg-opacity-30',
  error:
    'bg-error bg-opacity-20 text-error dark:bg-opacity-30',
  info:
    'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100',
};

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  const classes = [
    'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold',
    variants[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
