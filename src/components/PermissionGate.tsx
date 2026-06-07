/**
 * PermissionGate component for conditional rendering based on permissions
 */
import React from "react";

export type PermissionType =
  | "workflow:create"
  | "workflow:read"
  | "workflow:update"
  | "workflow:delete"
  | "workflow:execute"
  | "execution:read"
  | "execution:retry"
  | "integration:create"
  | "integration:read"
  | "integration:update"
  | "integration:delete"
  | "analytics:read"
  | "user:read"
  | "user:update"
  | "admin:access";

export type RoleType = "Admin" | "User" | "Viewer";

interface PermissionGateProps {
  permissions?: PermissionType[];
  roles?: RoleType[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  userPermissions?: PermissionType[];
  userRoles?: RoleType[];
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
  children,
  userPermissions = [],
  userRoles = ["Viewer"],
}) => {
  const hasPermission = (permission: PermissionType) => {
    return userPermissions.includes(permission);
  };

  const hasRole = (role: RoleType) => {
    return userRoles.includes(role);
  };

  let isAuthorized = false;

  if (permissions.length > 0 || roles.length > 0) {
    const permissionCheck = permissions.length === 0 ||
      (requireAll
        ? permissions.every(hasPermission)
        : permissions.some(hasPermission));

    const roleCheck = roles.length === 0 ||
      (requireAll
        ? roles.every(hasRole)
        : roles.some(hasRole));

    isAuthorized = permissionCheck && roleCheck;
  } else {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface IfAllowedProps {
  permission?: PermissionType;
  permissions?: PermissionType[];
  role?: RoleType;
  roles?: RoleType[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  userPermissions?: PermissionType[];
  userRoles?: RoleType[];
}

export const IfAllowed: React.FC<IfAllowedProps> = ({
  permission,
  permissions = [],
  role,
  roles = [],
  fallback = null,
  children,
  userPermissions = [],
  userRoles = ["Viewer"],
}) => {
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  const allRoles = role ? [role, ...roles] : roles;

  return (
    <PermissionGate
      permissions={allPermissions}
      roles={allRoles}
      fallback={fallback}
      userPermissions={userPermissions}
      userRoles={userRoles}
    >
      {children}
    </PermissionGate>
  );
};

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: PermissionType;
  permissions?: PermissionType[];
  role?: RoleType;
  roles?: RoleType[];
  userPermissions?: PermissionType[];
  userRoles?: RoleType[];
  children: React.ReactNode;
}

export const ProtectedButton: React.FC<ActionButtonProps> = ({
  permission,
  permissions = [],
  role,
  roles = [],
  userPermissions = [],
  userRoles = ["Viewer"],
  disabled = false,
  children,
  ...props
}) => {
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  const allRoles = role ? [role, ...roles] : roles;

  const hasPermission = (p: PermissionType) => userPermissions.includes(p);
  const hasRole = (r: RoleType) => userRoles.includes(r);

  let isAuthorized = true;

  if (allPermissions.length > 0 || allRoles.length > 0) {
    const permissionCheck = allPermissions.length === 0 ||
      allPermissions.some(hasPermission);

    const roleCheck = allRoles.length === 0 ||
      allRoles.some(hasRole);

    isAuthorized = permissionCheck && roleCheck;
  }

  return (
    <button
      disabled={disabled || !isAuthorized}
      title={!isAuthorized ? "You do not have permission for this action" : ""}
      {...props}
    >
      {children}
    </button>
  );
};
