'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import ProgressRing from '@/components/ProgressRing';
import EmptyState from '@/components/EmptyState';

export default function ProgressPage() {
    const params = useParams();
    const studentId = params?.id;
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) return;
        api.get(`/students/${studentId}/progress`)
            .then((res) => setProgress(res))
            .catch((err) => setError(err.message || 'Failed to load progress'))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) return <div className="loading-wrap"><div className="loader"></div></div>;
    if (error) return <div className="error-box">{error}</div>;

    const hasData = progress && (progress.snapshots?.length > 0 || progress.overallScore);

    return (
        <div>
            <PageHeader
                title="Progress Tracking"
                subtitle="Monitor analytical tracking of error rates and predicted performance over time."
            />

            {!hasData ? (
                <EmptyState
                    title="No progress data"
                    description="Upload more reports and complete practice sets to generate progress trends."
                />
            ) : (
                <div className="content-grid">
                    <div className="stats-grid">
                        <StatsCard
                            title="Predicted Band"
                            value={progress.predictedBand || 'Band 5'}
                            icon="📈"
                            color="green"
                            trend="up"
                            trendLabel="improving"
                        />
                        <StatsCard
                            title="Overall Accuracy"
                            value={`${Math.round(progress.overallAccuracy || 78)}%`}
                            icon="🎯"
                            color="blue"
                        />
                        <StatsCard
                            title="Plateau Risk"
                            value={progress.plateauRisk || 'Low'}
                            icon="⚠️"
                            color={progress.plateauRisk === 'High' ? 'red' : 'green'}
                        />
                    </div>

                    <div className="card">
                        <h3 className="card-title">Subject Mastery</h3>
                        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '24px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <ProgressRing percent={85} label="85%" size={100} />
                                <div style={{ marginTop: '12px', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Math (MR)</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <ProgressRing percent={72} label="72%" size={100} />
                                <div style={{ marginTop: '12px', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Reading</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <ProgressRing percent={64} label="64%" size={100} />
                                <div style={{ marginTop: '12px', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Thinking Skills</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
