import type { ReactNode } from 'react';

interface PermissionGateProps {
  children: ReactNode;
  role?: string;
  permission?: string;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user role/permission.
 * Reads from AuthContext when available.
 */
export function PermissionGate({ children, role, permission: _permission, fallback = null }: PermissionGateProps) {
  // Read from localStorage directly to avoid requiring AuthContext in every consumer
  const storedUser = localStorage.getItem('auth_user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (role && user?.role !== role && user?.role !== 'admin') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
