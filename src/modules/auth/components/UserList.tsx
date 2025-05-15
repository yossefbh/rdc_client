import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { toast } from 'react-toastify';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MonitorIcon from '@mui/icons-material/Monitor';
import PersonAddIcon from '@mui/icons-material/PersonAdd';


export const UserList = () => {
  const { users, roles, loading, error, fetchUsers, fetchRoles, handleCreateUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

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
          icon = <AdminPanelSettingsIcon className="text-purple-600 mr-2"  sx={{fontSize : '21px'}}/>;
        } else if (roleName === 'gestionnaire') {
          icon = <MonitorIcon className="text-red-600 mr-2" sx={{fontSize : '21px'}}/>;
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
      renderCell: () => (
        <div className="relative flex justify-center items-center h-full">
          <button className="text-black hover:text-gray-800 text-2xl p-0.5 rounded-full">
            ...
          </button>
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
        <button
        onClick={handleOpenCreateModal}
        className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-400 cursor-pointer flex items-center gap-2"
        >
        <PersonAddIcon /> Ajouter Utilisateur
        </button>
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
    </div>
  );
};