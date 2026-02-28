'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { setStoredToken } from '@/lib/auth-client';

import { Mail, Lock, UserPlus } from 'lucide-react';

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

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: { email, password },
      });

      if (!response.ok) {
        setError(response.data?.error || 'Registration failed. Try a different email.');
        return;
      }

      setStoredToken(response.data.token);
      router.replace('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Create SPIS Account</h1>
        <p>Start your student's learning diagnostics journey today.</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Email Address
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label>
            Secure Password
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button className="primary-btn" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account...' : (
              <>
                <UserPlus size={18} />
                Get Started
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--muted)' }}>Already have an account? </span>
          <Link className="inline-link" href="/login">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
