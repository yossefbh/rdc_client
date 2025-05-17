import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaHome, FaUsers, FaFileInvoice, FaMoneyBillWave, FaBalanceScale, FaQuestionCircle, FaInfoCircle, FaChartBar, FaCalendarAlt, FaChartPie, FaChartLine, FaUserShield, FaUserTag, FaKey, FaUser } from 'react-icons/fa';

interface Props {
  onSelect: (section: string) => void;
}

export const DashboardSidebar = ({ onSelect }: Props) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isAccueilOpen, setIsAccueilOpen] = useState<boolean>(false);
  const [isRolesPermissionsOpen, setIsRolesPermissionsOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false); 
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleItemClick = (section: string) => {
    if (section === 'accueil') {
      setIsAccueilOpen(!isAccueilOpen);
      setIsRolesPermissionsOpen(false);
    } else if (section === 'roles-permissions') {
      setIsRolesPermissionsOpen(!isRolesPermissionsOpen);
      setIsAccueilOpen(false);
    } else {
      setSelectedItem(section);
      onSelect(section);
      setIsAccueilOpen(false);
      setIsRolesPermissionsOpen(false);
    }
  };

  const handleSubItemClick = (subSection: string) => {
    setSelectedItem(subSection);
    onSelect(subSection);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('user'); 
    router.push('/auth/login'); 
  };

  const handleLogoutClick = () => {
    setShowConfirmModal(true); 
  };

  const handleCancelLogout = () => {
    setShowConfirmModal(false); 
    setShowLogout(false); 
  };

  return (
    <aside className="w-68 min-w-60 max-w-80 flex-shrink-0 bg-blue-900 text-white h-screen overflow-y-auto">
      <div className="p-6 flex flex-col min-h-full">
        <h2 className="text-xl font-bold mb-7">Menu</h2>
        <ul className="space-y-7 flex-1">
          <li
            className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
              selectedItem?.startsWith('accueil') ? 'font-bold text-blue-400' : ''
            }`}
          >
            <div className="flex items-center w-full" onClick={() => handleItemClick('accueil')}>
              <FaHome className="mr-3" />
              Accueil
            </div>
          </li>
          {isAccueilOpen && (
            <ul className="pl-5 space-y-5">
              <li
                onClick={() => handleSubItemClick('accueil-tableau')}
                className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
                  selectedItem === 'accueil-tableau' ? 'font-bold text-blue-400' : ''
                }`}
              >
                <FaChartBar className="mr-3" />
                Tableau de Bord
              </li>
              <li
                onClick={() => handleSubItemClick('accueil-calendrier')}
                className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
                  selectedItem === 'accueil-calendrier' ? 'font-bold text-blue-400' : ''
                }`}
              >
                <FaCalendarAlt className="mr-3" />
                Calendrier
              </li>
              <li
                onClick={() => handleSubItemClick('accueil-rapports')}
                className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
                  selectedItem === 'accueil-rapports' ? 'font-bold text-blue-400' : ''
                }`}
              >
                <FaChartPie className="mr-3" />
                Rapports
              </li>
              <li
                onClick={() => handleSubItemClick('accueil-stats-avancees')}
                className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
                  selectedItem === 'accueil-stats-avancees' ? 'font-bold text-blue-400' : ''
                }`}
              >
                <FaChartLine className="mr-3" />
                Stats Avancées
              </li>
            </ul>
          )}
          <li
            onClick={() => handleItemClick('acheteurs')}
            className={`flex items-center cursor-pointer hover:text-blue-700 text-lg ${
              selectedItem === 'acheteurs' ? 'font-bold text-blue-500' : ''
            }`}
          >
            <FaUsers className="mr-3" />
            Acheteurs
          </li>
          <li
            onClick={() => handleItemClick('factures')}
            className={`flex items-center cursor-pointer hover:text-blue-700 text-lg ${
              selectedItem === 'factures' ? 'font-bold text-blue-500' : ''
            }`}
          >
            <FaFileInvoice className="mr-3" />
            Factures
          </li>
          <li
            onClick={() => handleItemClick('paiements')}
            className={`flex items-center cursor-pointer hover:text-blue-700 text-lg ${
              selectedItem === 'paiements' ? 'font-bold text-blue-500' : ''
            }`}
          >
            <FaMoneyBillWave className="mr-3" />
            Paiements
          </li>
          <li
            onClick={() => handleItemClick('Litige')}
            className={`flex items-center cursor-pointer hover:text-blue-700 text-lg ${
              selectedItem === 'Litige' ? 'font-bold text-blue-500' : ''
            }`}
          >
            <FaBalanceScale className="mr-3" />
            Litiges
          </li>
          <li
            className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
              selectedItem === 'roles' || selectedItem === 'permissions' ? 'font-bold text-blue-400' : ''
            }`}
          >
            <div className="flex items-center w-full" onClick={() => handleItemClick('roles-permissions')}>
              <FaUserShield className="mr-3" />
              Rôles et Permissions
            </div>
          </li>
          {isRolesPermissionsOpen && (
            <ul className="pl-5 space-y-5">
              <li
                onClick={() => handleSubItemClick('roles')}
                className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
                  selectedItem === 'roles' ? 'font-bold text-blue-400' : ''
                }`}
              >
                <FaUserTag className="mr-3" />
                Rôles
              </li>
              <li
                onClick={() => handleSubItemClick('permissions')}
                className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
                  selectedItem === 'permissions' ? 'font-bold text-blue-400' : ''
                }`}
              >
                <FaKey className="mr-3" /> 
                Permissions
              </li>
            </ul>
          )}
          <li
            onClick={() => handleItemClick('users')}
            className={`flex items-center cursor-pointer hover:text-blue-700 text-lg ${
              selectedItem === 'users' ? 'font-bold text-blue-500' : ''
            }`}
          >
            <FaUser className="mr-3" />
            Utilisateurs
          </li>
          <li
            onClick={() => handleItemClick('aide')}
            className={`flex items-center cursor-pointer hover:text-blue-700 text-lg ${
              selectedItem === 'aide' ? 'font-bold text-blue-500' : ''
            }`}
          >
            <FaQuestionCircle className="mr-3" />
            Aide
          </li>
          <li
            onClick={() => handleItemClick('aPropos')}
            className={`flex items-center cursor-pointer hover:text-blue-700 text-lg ${
              selectedItem === 'aPropos' ? 'font-bold text-blue-500' : ''
            }`}
          >
            <FaInfoCircle className="mr-3" />
            À Propos
          </li>
        </ul>
        {user && (
          <div className="mt-7 relative">
            <div
              className="p-3 bg-blue-700 rounded-lg border-blue-600 cursor-pointer hover:bg-blue-800 flex items-center "
              onClick={() => setShowLogout(!showLogout)}
            >
              <FaUser className="mr-1  text-white text-3xl" />
              <div>
                <p className="font-semibold">User : {user.username}</p>
                <p className="px-2 font-bold">{user.role?.roleName || 'Non défini'}</p>
              </div>
            </div>
            {showLogout && (
              <div className="absolute bottom-full left-0 w-full bg-white text-black rounded-t shadow-lg">
                <button
                  className="w-full text-left p-2 px-15 hover:bg-gray-200 rounded-t cursor-pointer"
                  onClick={handleLogoutClick}
                >
                   Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-black">Se déconnecter du compte ?</h3>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
                  onClick={handleLogoutConfirm}
                >
                  Oui
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
                  onClick={handleCancelLogout}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};