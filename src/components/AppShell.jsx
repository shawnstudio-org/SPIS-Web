'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredToken } from '@/lib/auth-client';
import { apiRequest } from '@/lib/api';

import { LayoutDashboard, Users, ShieldCheck, LogOut } from 'lucide-react';

const cls = (...parts) => parts.filter(Boolean).join(' ');

export default function AppShell({ title, user, plan, token, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/settings/plan', label: 'Plan', icon: ShieldCheck },
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
          <p className="kicker">SPIS Portal</p>
          <h1>{title}</h1>
          <p className="meta">{user?.email || 'User'} • {plan} Tier</p>
        </div>
        <button className="ghost-btn" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <nav className="nav-row">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cls('nav-chip', pathname.startsWith(item.href) && 'active')}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="content-grid">{children}</main>
    </div>
  );
}
