'use client';
import { useState } from 'react';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardContent } from './components/DashboardContent';

export default function DashboardModule() {
  const [selected, setSelected] = useState('menu');

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar onSelect={setSelected} />
      <DashboardContent selected={selected} />
    </div>
  );
}
