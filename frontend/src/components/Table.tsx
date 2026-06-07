import type { HTMLAttributes, ReactNode } from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: keyof T) => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  rowKey: keyof T;
}

export function Table<T extends object>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  rowKey,
  className,
  ...props
}: TableProps<T>) {
  const classes = [
    'w-full border-collapse rounded-lg overflow-hidden shadow-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="overflow-x-auto">
      <table className={classes} {...props}>
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
              >
                {column.sortable && onSort ? (
                  <button
                    onClick={() => onSort(column.key)}
                    className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {column.label}
                    {sortKey === column.key && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={String(row[rowKey])}
                className={[
                  'border-b border-gray-200 dark:border-gray-700',
                  'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900',
                ].join(' ')}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-3 text-sm text-gray-900 dark:text-white"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
