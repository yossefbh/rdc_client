import React from 'react';

interface Props {
  onSelect: (section: string) => void;
}

export const DashboardSidebar = ({ onSelect }: Props) => {
  return (
    <aside className="w-64 bg-blue-900 text-white p-6">
      <h2 className="text-xl font-bold mb-6">Menu</h2>
      <ul className="space-y-4">
        <li onClick={() => onSelect('menu')} className="hover:text-blue-300 cursor-pointer">Accueil</li>
        <li onClick={() => onSelect('acheteurs')} className="hover:text-blue-300 cursor-pointer">Acheteurs</li>
        <li onClick={() => onSelect('factures')} className="hover:text-blue-300 cursor-pointer">Factures</li>
      </ul>
    </aside>
  );
};
