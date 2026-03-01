'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
    const pathname = usePathname();
    const [userEmail, setUserEmail] = useState('');
    const [plan, setPlan] = useState('FREE');
    const [studentCtx, setStudentCtx] = useState({ id: null, name: null });

    useEffect(() => {
        import('@/lib/auth-client').then(({ getSession }) => {
            const session = getSession();
            if (session) {
                setUserEmail(session.email || '');
                setPlan(session.plan || 'FREE');
            }
        });
    }, []);

    useEffect(() => {
        const match = pathname.match(/\/students\/(\d+)/);
        if (match) {
            const id = match[1];
            setStudentCtx((prev) => (prev.id === id ? prev : { id, name: null }));
            import('@/lib/api').then(({ default: api }) => {
                api.get(`/students/${id}`).then((res) => {
                    if (res?.name) setStudentCtx({ id, name: res.name });
                }).catch(() => { });
            });
        } else {
            setStudentCtx({ id: null, name: null });
        }
    }, [pathname]);

    return (
        <div className="app-layout">
            <Sidebar
                userEmail={userEmail}
                plan={plan}
                studentId={studentCtx.id}
                studentName={studentCtx.name}
            />
            <main className="main-content">{children}</main>
        </div>
    );
}
