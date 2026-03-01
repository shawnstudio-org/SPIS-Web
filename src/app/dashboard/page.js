'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const profile = await api.get('/users/me');
                setData(profile);
            } catch (err) {
                setError(err.message || 'Failed to load dashboard.');
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="loading-wrap">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) {
        return <div className="error-box">{error}</div>;
    }

    const { students = [] } = data || {};
    const hasStudents = students.length > 0;

    const totalStudents = students.length;

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Overview of your students and their performance."
            />

            <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <StatsCard
                    title="Active Students"
                    value={totalStudents}
                    icon="🎓"
                    color="blue"
                />
                <StatsCard
                    title="Total Reports"
                    value={students.reduce((acc, s) => acc + (s.reportsCount || 0), 0)}
                    icon="📄"
                    color="amber"
                    trend="up"
                    trendLabel="reports added"
                />
                <StatsCard
                    title="Avg. Predicted Band"
                    value="-"
                    icon="📈"
                    color="green"
                    hint="Requires more progress data"
                />
            </div>

            {!hasStudents ? (
                <EmptyState
                    title="No students yet"
                    description="Add a student to start uploading reports and generating practice sets."
                    actionText="Add Student"
                    onAction={() => window.location.href = '/students'}
                />
            ) : (
                <div className="content-grid two-col">
                    <div className="card">
                        <h3 className="card-title">Recent Activity</h3>
                        <p className="text-sm muted-text">No recent activity to show.</p>
                    </div>
                    <div className="card">
                        <h3 className="card-title">Quick Actions</h3>
                        <div className="btn-row">
                            <Link href={`/students/${students[0].id}/reports/new`} className="primary-btn">
                                Upload Report
                            </Link>
                            <Link href={`/students/${students[0].id}/daily-practice`} className="secondary-btn">
                                Daily Practice
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
