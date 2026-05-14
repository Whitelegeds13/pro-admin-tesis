/**
 * Constantes de roles y permisos del sistema.
 * Define qué acciones puede realizar cada tipo de usuario.
 */

export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Productos
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  // Ventas
  SALES_READ: 'sales:read',
  SALES_CREATE: 'sales:create',
  SALES_UPDATE: 'sales:update',
  SALES_PROCESS: 'sales:process',

  // Compras
  PURCHASES_READ: 'purchases:read',
  PURCHASES_CREATE: 'purchases:create',
  PURCHASES_UPDATE: 'purchases:update',

  // Inventario
  INVENTORY_READ: 'inventory:read',
  INVENTORY_MANAGE: 'inventory:manage',

  // Clientes
  CLIENTS_READ: 'clients:read',
  CLIENTS_UPDATE: 'clients:update',

  // Reportes
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Sistema
  SYSTEM_MANAGE: 'system:manage',
  EMPLOYEES_MANAGE: 'employees:manage',

  // Soporte
  SUPPORT_READ: 'support:read',
  SUPPORT_MANAGE: 'support:manage',

  // Pedidos
  ORDERS_READ: 'orders:read',
  ORDERS_PROCESS: 'orders:process',
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Mapa de permisos por rol.
 * Define qué permisos tiene cada rol del sistema.
 */
export const ROLE_PERMISSIONS: Record<RoleType, PermissionType[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin tiene todos los permisos

  [ROLES.EMPLOYEE]: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.SALES_PROCESS,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_PROCESS,
  ],

  [ROLES.CLIENT]: [
    PERMISSIONS.PRODUCTS_READ,
  ],
};

/**
 * Verifica si un rol tiene un permiso específico.
 */
export function hasPermission(role: RoleType, permission: PermissionType): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Verifica si un rol tiene todos los permisos indicados.
 */
export function hasAllPermissions(role: RoleType, permissions: PermissionType[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
