import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role, Permission, RolePermission } from '../types/Interface';
import { FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';

export const RoleList = () => {
  const { roles, permissions, loading, error, fetchRoles, fetchPermissions, fetchRoleById, handleCreateRole, handleUpdateRole } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isViewing, setIsViewing] = useState<boolean>(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [roleToView, setRoleToView] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserPermissions(JSON.parse(storedUser));
    }
  }, []);

  const hasRoleManagementCreatePermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des roles" && perm.canCreate
  );

  const hasRoleManagementWritePermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des roles" && perm.canWrite
  );

  const hasRoleManagementReadPermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des roles" && perm.canRead
  );

  const initializeRolePermissions = () => {
    setRolePermissions(
      permissions.map((permission) => ({
        permissionDefinitionID: permission.permissionDefinitionID,
        canRead: false,
        canWrite: false,
        canCreate: false,
      }))
    );
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setIsViewing(false);
    setRoleToEdit(null);
    setRoleName('');
    initializeRolePermissions();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (id: number) => {
    try {
      const role = await fetchRoleById(id);
      setRoleToEdit(role);
      setRoleName(role.roleName);
      setRolePermissions(
        role.rolePermissionResponses.map((rp) => ({
          permissionDefinitionID: rp.permissionDefinition.permissionDefinitionID,
          canRead: rp.canRead,
          canWrite: rp.canWrite,
          canCreate: rp.canCreate,
        }))
      );
      setIsEditing(true);
      setIsViewing(false);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Erreur lors de l'ouverture du modal d'édition");
    }
  };

  const handleOpenViewModal = async (id: number) => {
    try {
      const role = await fetchRoleById(id);
      setRoleToView(role);
      setRolePermissions(
        role.rolePermissionResponses.map((rp) => ({
          permissionDefinitionID: rp.permissionDefinition.permissionDefinitionID,
          canRead: rp.canRead,
          canWrite: rp.canWrite,
          canCreate: rp.canCreate,
        }))
      );
      setIsViewing(true);
      setIsEditing(false);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Erreur lors de l'ouverture du modal de visualisation");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setIsViewing(false);
    setRoleToEdit(null);
    setRoleToView(null);
    setRoleName('');
    setRolePermissions([]);
  };

  const handlePermissionChange = (
    permissionId: number,
    field: 'canRead' | 'canWrite' | 'canCreate',
    value: boolean
  ) => {
    setRolePermissions((prev) =>
      prev.map((rp) =>
        rp.permissionDefinitionID === permissionId ? { ...rp, [field]: value } : rp
      )
    );
  };

  const validateForm = () => {
    if (!roleName.trim()) {
      toast.error('Le nom du rôle est requis.', { position: 'top-center' });
      return false;
    }

    const hasPermissionSelected = rolePermissions.some(
      (rp) => rp.canRead || rp.canWrite || rp.canCreate
    );
    if (!hasPermissionSelected) {
      toast.error('Veuillez sélectionner au moins une permission.', { position: 'top-center' });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!isEditing && !validateForm()) {
      return;
    }

    const roleData = {
      roleName,
      rolePermission: rolePermissions,
    };

    try {
      if (isEditing && roleToEdit) {
        await handleUpdateRole(roleToEdit.roleID, roleData);
        toast.success('Rôle modifié avec succès !', { position: 'top-center' });
      } else {
        await handleCreateRole(roleData);
        toast.success('Rôle créé avec succès !', { position: 'top-center' });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Erreur lors de la soumission du rôle');
      toast.error('Erreur lors de la soumission du rôle.', { position: 'top-center' });
    }
  };

  if (loading) {
    return <p className="text-center text-black text-lg">Chargement des rôles...</p>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchRoles}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      {roles.length > 0 || true ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cartes mtaa rôlet */}
          {roles.map((role) => (
            <div
              key={role.roleID}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between h-32"
            >
              <div>
                <p className="text-sm text-gray-600">Total {role.roleUsers.length} users  </p>
                <h3 className="text-xl font-bold text-black mt-2">{role.roleName}</h3>
              </div>
              <div className="flex justify-between items-end mt-4">
                {hasRoleManagementWritePermission && (
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleOpenEditModal(role.roleID); }}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    Modifier Role
                  </a>
                )}
                {hasRoleManagementReadPermission && (
                  <button
                    onClick={() => handleOpenViewModal(role.roleID)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaEye size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Carte pour créer un nouveau rôle */}
          {hasRoleManagementCreatePermission && (
            <div
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg shadow-sm p-4 flex flex-col justify-center items-center cursor-pointer hover:bg-gray-100 transition"
              onClick={handleOpenCreateModal}
            >
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Créer nouveau Role
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-black">Aucun rôle trouvé.</p>
      )}

      {/* Modal pour création/modification  */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black text-center">
              {isViewing ? `Permissions du Rôle : ${roleToView?.roleName}` : isEditing ? 'Modifier le Rôle' : 'Créer un Rôle'}
            </h3>
            {!isViewing && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-1">Nom du Rôle</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full border p-2 rounded-lg text-black"
                  placeholder="Entrer le nom du rôle"
                />
              </div>
            )}
            <div className="mb-4">
              <h4 className="text-md font-semibold mb-2 text-black">Permissions</h4>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-black">Permission</th>
                    <th className="py-2 px-4 text-black">Lire</th>
                    <th className="py-2 px-3 text-black">Modifier</th>
                    <th className="py-2 px-4 text-black">Créer</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => {
                    const rolePermission = rolePermissions.find(
                      (rp) => rp.permissionDefinitionID === permission.permissionDefinitionID
                    );
                    return (
                      <tr key={permission.permissionDefinitionID} className="border-b">
                        <td className="py-2 px-4 text-black">{permission.permissionName}</td>
                        <td className="py-2 px-8 text-black">
                          <input
                            type="checkbox"
                            checked={rolePermission?.canRead || false}
                            onChange={(e) =>
                              handlePermissionChange(
                                permission.permissionDefinitionID,
                                'canRead',
                                e.target.checked
                              )
                            }
                            disabled={isViewing}
                          />
                        </td>
                        <td className="py-2 px-7 text-black">
                          <input
                            type="checkbox"
                            checked={rolePermission?.canWrite || false}
                            onChange={(e) =>
                              handlePermissionChange(
                                permission.permissionDefinitionID,
                                'canWrite',
                                e.target.checked
                              )
                            }
                            disabled={isViewing}
                          />
                        </td>
                        <td className="py-2 px-7 text-black">
                          <input
                            type="checkbox"
                            checked={rolePermission?.canCreate || false}
                            onChange={(e) =>
                              handlePermissionChange(
                                permission.permissionDefinitionID,
                                'canCreate',
                                e.target.checked
                              )
                            }
                            disabled={isViewing}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-gray-800"
              >
                {isViewing ? 'Fermer' : 'Annuler'}
              </button>
              {!isViewing && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isEditing ? 'Modifier' : 'Créer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};