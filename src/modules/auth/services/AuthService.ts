import { Permission, Role, CreateRoleRequest, User, CreateUserRequest } from '../types/Interface';

export const getPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await fetch('https://localhost:7284/api/Permissions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des permissions');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getRoles = async (): Promise<Role[]> => {
  try {
    const response = await fetch('https://localhost:7284/api/Roles/All', { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des rôles');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getRoleById = async (id: number): Promise<Role> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Roles/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du rôle');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createRole = async (roleData: CreateRoleRequest): Promise<void> => {
  try {
    const response = await fetch('https://localhost:7284/api/Roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la création du rôle');
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateRole = async (id: number, roleData: CreateRoleRequest): Promise<void> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du rôle');
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('https://localhost:7284/api/Users/All', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des utilisateurs');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createUser = async (userData: CreateUserRequest): Promise<any> => {
  try {
    const response = await fetch('https://localhost:7284/api/Users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (response.ok) {
      const data = await response.json();
      return data; 
    } else {
      const errorText = await response.text();
      return { error: errorText, status: response.status }; 
    }
  } catch (error: any) {
    throw new Error('Erreur réseau ou serveur lors de la création de l\'utilisateur');
  }
};
export const getUserHistory = async (userID: number): Promise<any> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Users/${userID}/Actions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la récupération de l’historique de l’utilisateur: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erreur réseau ou parsing pour userID ${userID}:`, error);
    throw error;
  }
};
export const deactivateUser = async (userID: number): Promise<any> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Users/Desactivate/${userID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la désactivation de l’utilisateur: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur réseau ou parsing pour userID ${userID}:`, error);
    throw error;
  }
};

export const activateUser = async (userID: number): Promise<any> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Users/Reactivate/${userID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la réactivation de l’utilisateur: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur réseau ou parsing pour userID ${userID}:`, error);
    throw error;
  }
};