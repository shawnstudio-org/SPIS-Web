'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/auth-client';
import LoadingState from '@/components/LoadingState';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.replace('/dashboard');
      return;
    }
    router.replace('/login');
  }, [router]);

  return <LoadingState text="Routing to SPIS..." />;
}
