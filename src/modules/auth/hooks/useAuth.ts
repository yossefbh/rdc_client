import { useState, useEffect } from 'react';
import { Permission, Role, User } from '../types/Interface';
import { getPermissions, getRoles, getRoleById, createRole, updateRole, getUsers, createUser, getUserHistory, deactivateUser, activateUser, updateUserRole } from '../services/AuthService';

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

  const fetchUserHistory = async (userID: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserHistory(userID);
      if (!response || typeof response !== 'object' || Object.keys(response).length === 0) {
        return null;
      }
      return response;
    } catch (err) {
      setError('Erreur lors de la récupération de l’historique de l’utilisateur');
      return null;
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

  const handleDeactivateUser = async (userID: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await deactivateUser(userID);
      if (response.success && response.data) {
        await fetchUsers();
        return response;
      } else {
        throw new Error('Échec de la désactivation de l\'utilisateur');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la désactivation de l\'utilisateur');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userID: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await activateUser(userID);
      if (response.success && response.data) {
        await fetchUsers();
        return response;
      } else {
        throw new Error('Échec de la réactivation de l\'utilisateur');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réactivation de l\'utilisateur');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userID: number, roleID: number) => {
    setLoading(true);
    setError(null);
    try {
      const success = await updateUserRole(userID, roleID);
      if (success) {
        await fetchUsers(); 
        return true;
      } else {
        throw new Error('Échec de la mise à jour du rôle de l\'utilisateur');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du rôle de l\'utilisateur');
      throw err;
    } finally {
      setLoading(false);
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
    fetchUserHistory,
    handleCreateRole,
    handleUpdateRole,
    handleCreateUser,
    handleDeactivateUser,
    handleActivateUser,
    handleUpdateUserRole,
  };
};