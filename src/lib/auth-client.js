'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getApiErrorMessage } from './api';

const TOKEN_KEY = 'spis_token';
const FLASH_KEY = 'spis_auth_flash';

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

export function setAuthFlashMessage(message) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(FLASH_KEY, String(message || ''));
}

export function consumeAuthFlashMessage() {
  if (typeof window === 'undefined') return '';
  const message = sessionStorage.getItem(FLASH_KEY) || '';
  sessionStorage.removeItem(FLASH_KEY);
  return message;
}

export function useAuthGuard({ redirectTo = '/login' } = {}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('FREE');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const run = async () => {
      const stored = getStoredToken();
      if (!stored) {
        setAuthFlashMessage('Please sign in to continue.');
        router.replace(redirectTo);
        return;
      }

      const me = await apiRequest('/auth/me', { token: stored });
      if (!me.ok) {
        clearStoredToken();
        setError(getApiErrorMessage(me, 'Your session expired. Please sign in again.'));
        setAuthFlashMessage(getApiErrorMessage(me, 'Your session expired. Please sign in again.'));
        router.replace(redirectTo);
        return;
      }

      if (!active) return;
      setToken(stored);
      setUser(me.data.user);
      setPlan(me.data.plan || 'FREE');
      setReady(true);
    };

    run();

    return () => {
      active = false;
    };
  }, [redirectTo, router]);

  return useMemo(
    () => ({ ready, token, user, plan, error }),
    [ready, token, user, plan, error],
  );
}

const SESSION_CACHE_KEY = 'spis_session';

export function saveSession({ email, plan }) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ email, plan }));
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function logout() {
  const token = getStoredToken();
  clearStoredToken();
  if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_CACHE_KEY);
  if (token) {
    try {
      await apiRequest('/auth/logout', { method: 'POST', token });
    } catch { }
  }
}
