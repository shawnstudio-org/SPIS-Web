'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { setStoredToken } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: { email, password },
    });

    setLoading(false);
    if (!response.ok) {
      setError(response.data?.error || 'Registration failed');
      return;
    }

    setStoredToken(response.data.token);
    router.replace('/dashboard');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Create SPIS Account</h1>
        <p>Parent account setup for student management and analysis.</p>

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
              minLength={8}
              required
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button className="primary-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: 16 }}>
          Already have an account?{' '}
          <Link className="inline-link" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
