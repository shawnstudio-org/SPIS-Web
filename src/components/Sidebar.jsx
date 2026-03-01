'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Students', href: '/students', icon: '👨‍🎓' },
    { label: 'Settings', href: '/settings/plan', icon: '⚙️' },
];

const STUDENT_SUB_NAV = [
    { label: 'Reports', suffix: '/reports', icon: '📄' },
    { label: 'Diagnosis', suffix: '/diagnosis', icon: '🔍' },
    { label: 'Prescriptions', suffix: '/prescriptions', icon: '💊' },
    { label: 'Daily Practice', suffix: '/daily-practice', icon: '✏️' },
    { label: 'Progress', suffix: '/progress', icon: '📈' },
    { label: 'Strategy', suffix: '/strategy', icon: '🎯' },
];

export default function Sidebar({ userEmail, plan, studentName, studentId }) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    const isActive = (href) =>
        pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

    const handleLogout = async () => {
        try {
            const { logout } = await import('@/lib/auth-client');
            await logout();
            router.push('/login');
        } catch {
            router.push('/login');
        }
    };

    return (
        <>
            <button
                className="sidebar-toggle"
                onClick={() => setOpen(!open)}
                aria-label="Toggle navigation"
            >
                {open ? '✕' : '☰'}
            </button>

            <div
                className={`sidebar-overlay ${open ? 'visible' : ''}`}
                onClick={() => setOpen(false)}
            />

            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">SP</div>
                    <span className="sidebar-brand-text">SPIS</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Menu</div>
                    {NAV_ITEMS.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            {item.label}
                        </a>
                    ))}

                    {studentId && (
                        <>
                            <div className="sidebar-section-label">
                                {studentName || 'Student'}
                            </div>
                            {STUDENT_SUB_NAV.map((item) => {
                                const href = `/students/${studentId}${item.suffix}`;
                                return (
                                    <a
                                        key={href}
                                        href={href}
                                        className={`sidebar-item ${pathname === href ? 'active' : ''}`}
                                    >
                                        <span className="sidebar-item-icon">{item.icon}</span>
                                        {item.label}
                                    </a>
                                );
                            })}
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {(userEmail || '?')[0].toUpperCase()}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-email">{userEmail || ''}</div>
                            {plan && <span className="sidebar-plan-badge">{plan}</span>}
                        </div>
                    </div>
                    <button className="sidebar-item" onClick={handleLogout}>
                        <span className="sidebar-item-icon">🚪</span>
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
}
