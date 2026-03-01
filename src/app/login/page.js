'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api';
import { consumeAuthFlashMessage, setStoredToken } from '@/lib/auth-client';

import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const flashMessage = consumeAuthFlashMessage();
    if (flashMessage) {
      setError(flashMessage);
    }
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setLoading(false);

    if (!response.ok) {
      setError(getApiErrorMessage(response, 'Login failed. Please check your credentials.'));
      return;
    }

    setStoredToken(response.data.token);
    router.replace('/dashboard');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>SPIS Login</h1>
        <p>Sign in to manage student reports, diagnosis, and weekly study actions.</p>

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
            Password
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          {error ? <div className="error-box" role="alert">{error}</div> : null}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span className="muted-text">New to SPIS? </span>
          <Link className="inline-link" href="/register">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
