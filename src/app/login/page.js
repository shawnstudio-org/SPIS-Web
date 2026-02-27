'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { setStoredToken } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();

    // Administrator skip code
    if (email === '1' || password === '1') {
      setStoredToken('admin-skip-token');
      router.replace('/dashboard');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      setLoading(false);
      if (!response.ok) {
        setError(response.data?.error || 'Login failed');
        return;
      }

      setStoredToken(response.data.token);
      router.replace('/dashboard');
    } catch (err) {
      setLoading(false);
      setError('Network or server error: ' + err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>SPIS Login</h1>
        <p>Access student diagnostics and prescriptions.</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: 16 }}>
          Need an account?{' '}
          <Link className="inline-link" href="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
