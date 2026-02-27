'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from './api';

const TOKEN_KEY = 'spis_token';

export function getStoredToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function useAuthGuard({ redirectTo = '/login' } = {}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('FREE');

  useEffect(() => {
    const run = async () => {
      const stored = getStoredToken();
      if (!stored) {
        router.replace(redirectTo);
        return;
      }

      const me = await apiRequest('/auth/me', { token: stored });
      if (!me.ok) {
        clearStoredToken();
        router.replace(redirectTo);
        return;
      }

      setToken(stored);
      setUser(me.data.user);
      setPlan(me.data.plan || 'FREE');
      setReady(true);
    };

    run();
  }, [redirectTo, router]);

  return useMemo(
    () => ({ ready, token, user, plan }),
    [ready, token, user, plan],
  );
}
