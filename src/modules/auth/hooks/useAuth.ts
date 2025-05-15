import { useState, useEffect } from 'react';
import { Permission, Role, User } from '../types/Interface';
import { getPermissions, getRoles, getRoleById, createRole, updateRole, getUsers, createUser } from '../services/AuthService';

export const useAuth = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPermissions();
      setPermissions(data);
    } catch (err) {
      setError('Erreur lors de la récupération des permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError('Erreur lors de la récupération des rôles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Erreur lors de la récupération des utilisateurs');
      throw err; 
    }
  };

  const fetchRoleById = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoleById(id);
      return data;
    } catch (err) {
      setError('Erreur lors de la récupération du rôle');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData: any) => {
    setLoading(true);
    setError(null);
    try {
      await createRole(roleData);
      await fetchRoles(); 
    } catch (err) {
      setError('Erreur lors de la création du rôle');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (id: number, roleData: any) => {
    setLoading(true);
    setError(null);
    try {
      await updateRole(id, roleData);
      await fetchRoles(); 
    } catch (err) {
      setError('Erreur lors de la mise à jour du rôle');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    setError(null);
    try {
      const response = await createUser(userData);
      if (response && typeof response === 'object' && 'error' in response && response.status === 409) {
        return response.error; 
      } else if (typeof response === 'number') {
        fetchUsers(); 
        return response;
      } else {
        throw new Error('Erreur inattendue lors de la création de l\'utilisateur');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'utilisateur');
      throw err;
    }
  };

  return {
    permissions,
    roles,
    users,
    loading,
    error,
    fetchPermissions,
    fetchRoles,
    fetchUsers,
    fetchRoleById,
    handleCreateRole,
    handleUpdateRole,
    handleCreateUser,
  };
};