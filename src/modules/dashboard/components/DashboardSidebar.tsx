import React, { useState } from 'react';
import { FaHome, FaUsers, FaFileInvoice, FaMoneyBillWave, FaBalanceScale, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';

interface Props {
  onSelect: (section: string) => void;
}

export const DashboardSidebar = ({ onSelect }: Props) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemClick = (section: string) => {
    setSelectedItem(section);
    onSelect(section);
  };

  return (
    <aside className="w-66 min-w-60 max-w-80 flex-shrink-0 bg-blue-900 text-white p-6 h-screen">
      <h2 className="text-xl font-bold mb-7">Menu</h2>
      <ul className="space-y-7">
        <li
          onClick={() => handleItemClick('menu')}
          className={`flex items-center cursor-pointer hover:text-blue-300 text-lg ${
            selectedItem === 'menu' ? 'font-bold text-blue-400' : ''
          }`}
        >
          <FaHome className="mr-3" />
          Accueil
        </li>
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
    </aside>
  );
};