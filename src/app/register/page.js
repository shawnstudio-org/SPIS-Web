'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api';
import { setStoredToken } from '@/lib/auth-client';

import { Mail, Lock, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
    setLoading(false);

    if (!response.ok) {
      setError(getApiErrorMessage(response, 'Registration failed. Try a different email.'));
      return;
    }

    setStoredToken(response.data.token);
    router.replace('/dashboard');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Create SPIS Account</h1>
        <p>Start a safer, clearer workflow for tracking report quality and study priorities.</p>

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

          <label>
            Confirm Password
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
          </label>

          {error ? <div className="error-box" role="alert">{error}</div> : null}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : (
              <>
                <UserPlus size={18} />
                Get Started
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span className="muted-text">Already have an account? </span>
          <Link className="inline-link" href="/login">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
