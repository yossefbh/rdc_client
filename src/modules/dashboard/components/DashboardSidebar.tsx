import React, { useState } from 'react';

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
    <aside className="w-58 min-w-54 max-w-64 flex-shrink-0 bg-blue-900 text-white p-6 h-screen">
      <h2 className="text-xl font-bold mb-6">Menu</h2>
      <ul className="space-y-5">
        <li
          onClick={() => handleItemClick('menu')}
          className={`cursor-pointer hover:text-blue-300 ${
            selectedItem === 'menu' ? 'font-bold text-blue-400' : ''
          }`}
        >
          Accueil
        </li>
        <li
          onClick={() => handleItemClick('acheteurs')}
          className={`cursor-pointer hover:text-blue-700 ${
            selectedItem === 'acheteurs' ? 'font-bold text-blue-500' : ''
          }`}
        >
          Acheteurs
        </li>
        <li
          onClick={() => handleItemClick('factures')}
          className={`cursor-pointer hover:text-blue-700 ${
            selectedItem === 'factures' ? 'font-bold text-blue-500' : ''
          }`}
        >
          Factures
        </li>
        <li
          onClick={() => handleItemClick('paiements')}
          className={`cursor-pointer hover:text-blue-700 ${
            selectedItem === 'paiements' ? 'font-bold text-blue-500' : ''
          }`}
        >
          Paiements
        </li>
        <li
          onClick={() => handleItemClick('Litige')}
          className={`cursor-pointer hover:text-blue-700 ${
            selectedItem === 'Litige' ? 'font-bold text-blue-500' : ''
          }`}
        >
          Litiges
        </li>
      </ul>
    </aside>
  );
};