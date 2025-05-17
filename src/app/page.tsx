// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardModule from '@/modules/dashboard/dashboard.module';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth/login');
    } else {
      setIsLoading(false); 
    }
  }, [router]);

  if (isLoading) {
    return <div>Chargement...</div>; 
  }

  return <DashboardModule />;
}