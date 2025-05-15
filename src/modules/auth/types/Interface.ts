export interface Permission {
  permissionDefinitionID: number;
  permissionName: string;
}

export interface RolePermission {
  permissionDefinitionID: number;
  canRead: boolean;
  canWrite: boolean;
  canCreate: boolean;
}

export interface Role {
  roleID: number;
  roleName: string;
  rolePermissionResponses: RolePermissionResponse[];
  roleUsers: User[];
}

export interface RolePermissionResponse {
  id: number;
  permissionDefinition: Permission;
  canRead: boolean;
  canWrite: boolean;
  canCreate: boolean;
}

export interface CreateRoleRequest {
  roleName: string;
  rolePermission: RolePermission[];
}

export interface User {
  userID: number;
  username: string | null;
  email: string;
  userStatus: 'EN_ATTENTE' | 'ACTIVE' | 'INACTIVE';
  role: Role;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  roleID: number;
}