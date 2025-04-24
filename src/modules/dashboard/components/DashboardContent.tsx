import React from 'react';
import { AcheteurList } from '@/modules/acheteurs/components/AcheteurList';
import { FactureList } from '@/modules/factures/components/FactureList';
import { PaiementList } from '@/modules/paiements/components/PaiementList';
import { LitigeList } from '@/modules/Litige/components/LitigeList';

interface Props {
  selected: string;
}

export const DashboardContent = ({ selected }: Props) => {
  return (
    <main className="flex-1 bg-gray-100 p-8 h-screen overflow-auto">
      {selected === 'menu' && (
        <>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Bienvenue sur le Dashboard</h1>
          <p className="text-gray-600">Sélectionnez une option dans le menu pour commencer.</p>
        </>
      )}
      {selected === 'acheteurs' && <AcheteurList />}
      {selected === 'factures' && <FactureList />}
      {selected === 'paiements' && <PaiementList />}
      {selected==='Litige' && <LitigeList />}
    </main>
  );
};
