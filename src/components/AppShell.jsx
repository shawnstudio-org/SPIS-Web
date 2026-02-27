'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredToken } from '@/lib/auth-client';
import { apiRequest } from '@/lib/api';

const cls = (...parts) => parts.filter(Boolean).join(' ');

export default function AppShell({ title, user, plan, token, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/students', label: 'Students' },
    { href: '/settings/plan', label: 'Plan' },
  ];

  async function logout() {
    await apiRequest('/auth/logout', { method: 'POST', token });
    clearStoredToken();
    router.replace('/login');
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="kicker">SPIS</p>
          <h1>{title}</h1>
          <p className="meta">{user?.email || ''} | Plan: {plan}</p>
        </div>
        <button className="ghost-btn" onClick={logout}>Logout</button>
      </header>

      <nav className="nav-row">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cls('nav-chip', pathname.startsWith(item.href) && 'active')}>
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="content-grid">{children}</main>
    </div>
  );
}
