import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function Card({
  children,
  hoverable = false,
  className,
  ...props
}: CardProps) {
  const classes = [
    'rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm',
    hoverable && 'hover:shadow-md transition-shadow cursor-pointer',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  const classes = ['p-6', className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children?: React.ReactNode;
}

export function CardHeader({
  title,
  children,
  className,
  ...props
}: CardHeaderProps) {
  const classes = ['px-6 py-4 border-b border-gray-200 dark:border-gray-700', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...props}>
      {title ? <h3 className="text-lg font-semibold">{title}</h3> : children}
    </div>
  );
}
