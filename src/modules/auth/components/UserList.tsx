import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { toast } from 'react-toastify';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MonitorIcon from '@mui/icons-material/Monitor';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export const UserList = () => {
  const { users, roles, loading, error, fetchUsers, fetchRoles, handleCreateUser, fetchUserHistory, handleDeactivateUser, handleActivateUser, handleUpdateUserRole } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [userHistory, setUserHistory] = useState<any>(null);
  const [selectedHistoryType, setSelectedHistoryType] = useState<string>('createdPlans');
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);
  const [showActivateModal, setShowActivateModal] = useState<boolean>(false);
  const [showUpdateRoleModal, setShowUpdateRoleModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [currentUserRoleId, setCurrentUserRoleId] = useState<number>(0);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserPermissions(JSON.parse(storedUser));
    }
  }, []);

  const hasUserManagementCreatePermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des utilisateurs" && perm.canCreate
  );

  const hasUserManagementWritePermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des utilisateurs" && perm.canWrite
  );

  const handleOpenCreateModal = () => {
    setEmail('');
    setSelectedRoleId(0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!email.trim() || selectedRoleId === 0) {
      toast.error('Veuillez remplir les champs.', { position: 'top-center' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Veuillez entrer un email valide !', { position: 'top-center' });
      return;
    }

    const userData = {
      email,
      roleID: selectedRoleId,
    };

    setIsSubmitting(true);
    try {
      const response = await handleCreateUser(userData);
      if (typeof response === 'number') {
        toast.success('Compte créé avec succès !', { position: 'top-center' });
        handleCloseModal();
      } else if (response === 'Email already exist!') {
        toast.error('Cet email est déjà utilisé.', { position: 'top-center' });
      } else {
        toast.error('Erreur inattendue lors de la création de l\'utilisateur.', { position: 'top-center' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création de l\'utilisateur.', { position: 'top-center' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMenu = (userId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  const showUserHistory = async (userId: number) => {
    try {
      const history = await fetchUserHistory(userId);
      console.log("Historique brut retourné par fetchUserHistory:", history);
      if (history && typeof history === 'object') {
        console.log("Contenu de userHistory:", {
          createdPlans: history.createdPlans,
          validatedPlans: history.validatedPlans,
          declaredLitiges: history.declaredLitiges,
          resolutedLitiges: history.resolutedLitiges,
          paidEcheances: history.paidEcheances,
        });
      } else {
        console.warn("Historique invalide ou vide pour userId:", userId);
      }
      setUserHistory(history);
      setShowHistoryModal(true);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'historique:", err);
      toast.error("Impossible de charger l'historique des actions", { position: 'top-center' });
    }
  };

  const handleOpenUpdateRoleModal = (userId: number, currentRoleId: number) => {
    setSelectedUserId(userId);
    setCurrentUserRoleId(currentRoleId);
    setSelectedRoleId(currentRoleId); 
    setShowUpdateRoleModal(true);
    setOpenMenuId(null);
  };

  const handleCloseUpdateRoleModal = () => {
    setShowUpdateRoleModal(false);
    setSelectedUserId(null);
    setCurrentUserRoleId(0);
    setSelectedRoleId(0);
  };

  const handleUpdateRole = async () => {
    if (!selectedUserId || selectedRoleId === 0) {
      toast.error('Veuillez sélectionner un rôle.', { position: 'top-center' });
      return;
    }

    if (selectedRoleId === currentUserRoleId) {
      toast.error('Changer rôle', { position: 'top-center' });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await handleUpdateUserRole(selectedUserId, selectedRoleId);
      if (success) {
        toast.success('Rôle mis à jour avec succès !', { position: 'top-center' });
        handleCloseUpdateRoleModal();
      } else {
        toast.error('Échec de la mise à jour du rôle.', { position: 'top-center' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour du rôle.', { position: 'top-center' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMontant = (montant: number | undefined | null) => {
    if (montant == null || isNaN(montant)) {
      return "0.000";
    }
    return montant.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const filteredUsers = users.filter(user =>
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'Username',
      width: 240,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      valueGetter: (value: string) => value || 'N/A',
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 310,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'role',
      headerName: 'Rôle',
      width: 260,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => {
        const roleName = params.value.roleName.toLowerCase();
        let icon = null;
        if (roleName === 'administrateur') {
          icon = <AdminPanelSettingsIcon className="text-purple-600 mr-2" sx={{ fontSize: '21px' }} />;
        } else if (roleName.includes('gestionnaire')) {
          icon = <MonitorIcon className="text-red-600 mr-2" sx={{ fontSize: '21px' }} />;
        }
        return (
          <div className="flex items-center justify-center">
            {icon}
            {params.value.roleName}
          </div>
        );
      },
    },
    {
      field: 'userStatus',
      headerName: 'Statut',
      width: 260,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium mx-auto ${
            params.value.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
            params.value.toLowerCase() === 'inactive' ? 'bg-red-100 text-red-700' :
            'bg-orange-200 text-orange-500'
          }`}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => (
        <div className="relative flex justify-center items-center h-full">
          <button
            onClick={(event) => toggleMenu(params.row.userID, event)}
            className="text-black hover:text-gray-800 text-2xl p-0.5 rounded-full"
          >
            ...
          </button>
          {openMenuId === params.row.userID && (
            <div
              className="absolute top-[100%] left-1/2 -translate-x-1/2 w-48 bg-white border rounded-md shadow-lg z-[1000] -mt-3"
              style={{ minHeight: '40px' }}
            >
              <div className="py-1">
                <button
                  onClick={() => showUserHistory(params.row.userID)}
                  className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-blue-50"
                >
                  Historique des actions
                </button>
                {params.row.role.roleName.toLowerCase() !== 'administrateur' && hasUserManagementWritePermission && (
                  <>
                    <button
                      onClick={() => handleOpenUpdateRoleModal(params.row.userID, params.row.role.roleID)}
                      className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-blue-50"
                    >
                      Modifier rôle
                    </button>
                    {params.row.userStatus.toLowerCase() === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedUserId(params.row.userID);
                          setShowDeactivateModal(true);
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-blue-50"
                      >
                        Désactiver
                      </button>
                    )}
                    {params.row.userStatus.toLowerCase() === 'inactive' && (
                      <button
                        onClick={() => {
                          setSelectedUserId(params.row.userID);
                          setShowActivateModal(true);
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-blue-50"
                      >
                        Activer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <p className="text-center text-black text-lg">Chargement des utilisateurs...</p>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center mb-4">
        <div className="flex-grow"></div>
        <div className="relative w-full max-w-90">
          <input
            type="text"
            placeholder="Rechercher un utilisateur"
            className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        <div className="flex-grow"></div>
        {hasUserManagementCreatePermission && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-400 cursor-pointer flex items-center gap-2"
          >
            <PersonAddIcon /> Ajouter Utilisateur
          </button>
        )}
      </div>

      <Box sx={{ height: '95vh', width: '100%' }} className="overflow-visible">
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => row.userID}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          filterMode="client"
          sortingMode="client"
          localeText={{
            noRowsLabel: searchTerm ? "Aucun utilisateur ne correspond à votre recherche." : "Aucun utilisateur trouvé.",
          }}
          rowHeight={65}
          sx={{
            '& .MuiDataGrid-cell': {
              overflow: 'visible',
            },
            '& .MuiDataGrid-row': {
              overflow: 'visible',
            },
          }}
        />
      </Box>

      {/* Modal pour ajouter un utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-black text-center">Ajouter un Utilisateur</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 rounded-lg text-black"
                placeholder="Entrer l'email"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">Rôle</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-full border p-2 rounded-lg text-black"
              >
                <option value={0}>Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.roleID} value={role.roleID}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Création en cours...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour modifier le rôle d'un utilisateur */}
      {showUpdateRoleModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <p className="text-sm text-gray-700 mb-4 text-center">
              Lorsque vous changez le rôle, les anciennes permissions du rôle actuel vont changer.
            </p>
             <div className="mb-4">
              <p className="w-full border p-2 rounded-lg text-black bg-gray-100">
                {users.find((user) => user.userID === selectedUserId)?.username || 'N/A'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">Rôle actuel</label>
              <p className="w-full border p-2 rounded-lg text-black bg-gray-100">
                {roles.find((role) => role.roleID === currentUserRoleId)?.roleName || 'N/A'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">Nouveau Rôle</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-full border p-2 rounded-lg text-black"
              >
                <option value={0}>Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.roleID} value={role.roleID}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCloseUpdateRoleModal}
                className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Mise à jour...' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour désactiver un utilisateur */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-black text-center">
              Voulez-vous désactiver cet utilisateur définitivement ?
            </h3>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setSelectedUserId(null);
                }}
                className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (selectedUserId) {
                    try {
                      await handleDeactivateUser(selectedUserId);
                      toast.success('Utilisateur désactivé', { position: 'top-center' });
                    } catch (err: any) {
                      toast.error(err.message || 'Erreur lors de la désactivation', { position: 'top-center' });
                    }
                  }
                  setShowDeactivateModal(false);
                  setSelectedUserId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour activer un utilisateur */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-black text-center">
              Voulez-vous activer cet utilisateur ?
            </h3>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowActivateModal(false);
                  setSelectedUserId(null);
                }}
                className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (selectedUserId) {
                    try {
                      await handleActivateUser(selectedUserId);
                      toast.success('Utilisateur réactivé avec succès', { position: 'top-center' });
                    } catch (err: any) {
                      toast.error(err.message || 'Erreur lors de la réactivation', { position: 'top-center' });
                    }
                  }
                  setShowActivateModal(false);
                  setSelectedUserId(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour l'historique des actions */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto text-black">
            <div className="text-center mb-6 border-b border-gray-200 pb-3">
              <h3 className="text-xl font-bold">Historique des Actions de l'Utilisateur</h3>
            </div>

            <div className="flex justify-around mb-4 bg-gray-200 text-black rounded-t-lg overflow-hidden">
              <button
                onClick={() => setSelectedHistoryType('createdPlans')}
                className={`flex-1 p-2 text-center ${selectedHistoryType === 'createdPlans' ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}
              >
                Plans créés
              </button>
              <button
                onClick={() => setSelectedHistoryType('validatedPlans')}
                className={`flex-1 p-2 text-center ${selectedHistoryType === 'validatedPlans' ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}
              >
                Plans validés
              </button>
              <button
                onClick={() => setSelectedHistoryType('declaredLitiges')}
                className={`flex-1 p-2 text-center ${selectedHistoryType === 'declaredLitiges' ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}
              >
                Litiges déclarés
              </button>
              <button
                onClick={() => setSelectedHistoryType('resolutedLitiges')}
                className={`flex-1 p-2 text-center ${selectedHistoryType === 'resolutedLitiges' ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}
              >
                Litiges résolus
              </button>
              <button
                onClick={() => setSelectedHistoryType('paidEcheances')}
                className={`flex-1 p-2 text-center ${selectedHistoryType === 'paidEcheances' ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}
              >
                Paiement
              </button>
            </div>

            {!userHistory ? (
              <div className="text-center p-4">
                <p>Aucune donnée d'historique disponible.</p>
              </div>
            ) : (
              <>
                {selectedHistoryType === 'createdPlans' && (
                  <table className="w-full bg-white shadow rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-3 text-lg">Plan ID</th>
                        <th className="p-3 text-lg">Date de création</th>
                        <th className="p-3 text-lg">Montant a payer</th>
                        <th className="p-3 text-lg">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHistory.createdPlans && userHistory.createdPlans.length > 0 ? (
                        userHistory.createdPlans.map((plan: any) => (
                          <tr key={plan.planID} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-center">{plan.planID}</td>
                            <td className="p-2 text-center">
                              {new Date(plan.creationDate).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-2 text-center">{formatMontant(plan.montantRestant)} DT</td>
                            <td className="p-2 text-center">{plan.planStatus}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center">
                            Aucun plan créé.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {selectedHistoryType === 'validatedPlans' && (
                  <table className="w-full bg-white shadow rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-3 text-lg">Plan ID</th>
                        <th className="p-3 text-lg">Date de création</th>
                        <th className="p-3 text-lg">Montant total</th>
                        <th className="p-3 text-lg">Montant restant</th>
                        <th className="p-3 text-lg">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHistory.validatedPlans && userHistory.validatedPlans.length > 0 ? (
                        userHistory.validatedPlans.map((plan: any) => (
                          <tr key={plan.planID} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-center">{plan.planID}</td>
                            <td className="p-2 text-center">
                              {new Date(plan.creationDate).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-2 text-center">{formatMontant(plan.montantTotal)} DT</td>
                            <td className="p-2 text-center">{formatMontant(plan.montantRestant)} DT</td>
                            <td className="p-2 text-center">{plan.planStatus}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center">
                            Aucun plan validé.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {selectedHistoryType === 'declaredLitiges' && (
                  <table className="w-full bg-white shadow rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-3 text-lg">Litige ID</th>
                        <th className="p-3 text-lg">Date de création</th>
                        <th className="p-3 text-lg">Facture</th>
                        <th className="p-3 text-lg">Type</th>
                        <th className="p-3 text-lg">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHistory.declaredLitiges && userHistory.declaredLitiges.length > 0 ? (
                        userHistory.declaredLitiges.map((litige: any) => (
                          <tr key={litige.litigeID} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-center">{litige.litigeID}</td>
                            <td className="p-2 text-center">
                              {new Date(litige.creationDate).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-2 text-center">{litige.facture.numFacture}</td>
                            <td className="p-2 text-center">{litige.type.litigeTypeName}</td>
                            <td className="p-2 text-center">{litige.litigeStatus}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center">
                            Aucun litige déclaré.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {selectedHistoryType === 'resolutedLitiges' && (
                  <table className="w-full bg-white shadow rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-3 text-lg">Litige ID</th>
                        <th className="p-1 text-lg">Date de résolution</th>
                        <th className="p-3 text-lg">Facture</th>
                        <th className="p-3 text-lg">Type</th>
                        <th className="p-3 text-lg">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHistory.resolutedLitiges && userHistory.resolutedLitiges.length > 0 ? (
                        userHistory.resolutedLitiges.map((litige: any) => (
                          <tr key={litige.litigeID} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-center">{litige.litigeID}</td>
                            <td className="p-2 text-center">
                              {litige.resolutionDate
                                ? new Date(litige.resolutionDate).toLocaleDateString('fr-FR')
                                : 'N/A'}
                            </td>
                            <td className="p-2 text-center">{litige.facture.numFacture}</td>
                            <td className="p-2 text-center">{litige.type.litigeTypeName}</td>
                            <td className="p-2 text-center">{litige.litigeStatus}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center">
                            Aucun litige résolu.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {selectedHistoryType === 'paidEcheances' && (
                  <table className="w-full bg-white shadow rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-3 text-lg">Paiement ID</th>
                        <th className="p-3 text-lg">Échéance ID</th>
                        <th className="p-3 text-lg">Date de paiement</th>
                        <th className="p-3 text-lg">Montant payé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHistory.paidEcheances && userHistory.paidEcheances.length > 0 ? (
                        userHistory.paidEcheances.map((paiement: any) => (
                          <tr key={paiement.paiementID} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-center">{paiement.paiementID}</td>
                            <td className="p-2 text-center">{paiement.paiementDateID}</td>
                            <td className="p-2 text-center">
                              {new Date(paiement.dateDePaiement).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-2 text-center">{formatMontant(paiement.montantPayee)} DT</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center">
                            Aucune échéance payée.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setUserHistory(null);
                  setSelectedHistoryType('createdPlans');
                }}
                className="px-8 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};