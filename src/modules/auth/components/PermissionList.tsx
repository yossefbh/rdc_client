import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const PermissionList = () => {
  const { permissions, loading, error, fetchPermissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filteredPermissions = permissions.filter(permission =>
    permission.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.permissionDefinitionID.toString().includes(searchTerm)
  );

  if (loading) {
    return <p className="text-center text-black text-lg">Chargement des permissions...</p>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchPermissions}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Rechercher une permission"
            className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"            value={searchTerm}
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
      </div>

      {filteredPermissions.length > 0 ? (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-4 px-4 text-black">ID</th>
              <th className="py-4 px-4 text-black">Nom de la Permission</th>
            </tr>
          </thead>
          <tbody>
            {filteredPermissions.map((permission) => (
              <tr key={permission.permissionDefinitionID} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4 text-black">{permission.permissionDefinitionID}</td>
                <td className="py-4 px-4 text-black">{permission.permissionName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : permissions.length > 0 ? (
        <p className="text-black text-center py-4">Aucune permission ne correspond à votre recherche.</p>
      ) : (
        <p className="text-black">Aucune permission trouvée.</p>
      )}
    </div>
  );
};