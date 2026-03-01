'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';

export default function SettingsPlanPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchPlan() {
            try {
                const planData = await api.get('/auth/me');
                setData(planData);
            } catch (err) {
                setError(err.message || 'Failed to load settings.');
            } finally {
                setLoading(false);
            }
        }
        fetchPlan();
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

    const plan = data?.plan || 'Unknown';
    const expiresAt = data?.expires_at ? new Date(data.expires_at).toLocaleDateString() : 'Never';

    return (
        <div>
            <PageHeader
                title="Settings & Plan"
                subtitle="Manage your subscription and account settings."
            />

            <div className="content-grid">
                <div className="card">
                    <h3 className="card-title">Current Plan</h3>

                    <div className="stats-grid" style={{ marginBottom: '32px', marginTop: '16px' }}>
                        <StatsCard
                            title="Plan Tier"
                            value={plan}
                            icon="💎"
                            color={plan === 'PREMIUM' ? 'amber' : 'blue'}
                        />
                        <StatsCard
                            title="Expiration"
                            value={expiresAt}
                            icon="📅"
                            color="slate"
                        />
                    </div>

                    {plan !== 'PREMIUM' && (
                        <div className="alert-message">
                            <p>Upgrade to Premium to unlock AI analysis, unlimited reports, and custom practice generation.</p>
                            <button className="primary-btn" style={{ marginTop: '16px' }}>
                                Upgrade to Premium
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
