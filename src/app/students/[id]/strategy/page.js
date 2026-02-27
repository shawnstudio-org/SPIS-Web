'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';

export default function StrategyPage({ params }) {
  const studentId = params.id;
  const { auth, student, error: studentError } = useStudentPage(studentId);
  const [strategy, setStrategy] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.ready) return;

    const run = async () => {
      const response = await apiRequest(`/students/${studentId}/strategy`, {
        token: auth.token,
      });

      if (!response.ok) {
        setError(response.data?.error || 'Unable to load strategy module');
        return;
      }

      setStrategy(response.data);
    };

    run();
  }, [auth.ready, auth.token, studentId]);

  if (!auth.ready) return <LoadingState text="Loading premium strategy..." />;

  return (
    <AppShell
      title={`Premium Strategy | ${student?.name || `Student ${studentId}`}`}
      user={auth.user}
      plan={auth.plan}
      token={auth.token}
    >
      <div className="card">
        <h2 className="card-title">Premium Strategy Module</h2>
        <div className="btn-row">
          <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>Diagnosis</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/prescriptions`}>Prescriptions</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/progress`}>Progress</Link>
        </div>
      </div>

      {studentError ? <div className="error-box">{studentError}</div> : null}
      {error ? (
        <div className="error-box">
          {error}
          <p style={{ marginTop: 8 }}>This page requires PREMIUM plan assignment.</p>
        </div>
      ) : null}

      {strategy ? (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Mock Readiness Index"
              value={strategy.mock_readiness_index}
              hint="Estimated readiness based on latest diagnostics"
            />
            <MetricCard
              label="Generated"
              value={strategy.generated_at?.slice(0, 10) || '-'}
              hint="Strategy snapshot timestamp"
            />
          </div>

          <div className="card form-grid">
            <h2 className="card-title">Quarterly Roadmap Note</h2>
            <p>{strategy.quarterly_roadmap_note}</p>
          </div>

          <div className="card form-grid">
            <h2 className="card-title">Parent Strategy Consultation Notes</h2>
            <p>{strategy.parent_strategy_consultation}</p>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
