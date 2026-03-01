'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';

export default function PrescriptionsPage({ params }) {
  const { id: studentId } = use(params);
  const { auth, student, error: studentError } = useStudentPage(studentId);
  const [diagnostics, setDiagnostics] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    const [diag, pres] = await Promise.all([
      apiRequest(`/students/${studentId}/diagnostics/latest`, { token: auth.token }),
      apiRequest(`/students/${studentId}/prescriptions/latest`, { token: auth.token }),
    ]);

    if (diag.ok) setDiagnostics(diag.data);
    if (pres.ok) setPrescription(pres.data?.id ? pres.data : null);
  }

  useEffect(() => {
    if (!auth.ready) return;
    loadData();
  }, [auth.ready]);

  async function generatePrescription() {
    const analysisId = diagnostics?.id;
    if (!analysisId) {
      setError('Run analysis first before generating prescription.');
      return;
    }

    setError('');
    setMessage('');

    const response = await apiRequest(`/analyses/${analysisId}/prescribe`, {
      method: 'POST',
      token: auth.token,
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to generate prescription');
      return;
    }

    setMessage(`Prescription ${response.data.id} generated.`);
    loadData();
  }

  async function updateItemStatus(itemId, status) {
    const response = await apiRequest(`/prescription-items/${itemId}`, {
      method: 'PATCH',
      token: auth.token,
      body: { status },
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to update item status');
      return;
    }

    loadData();
  }

  if (!auth.ready) return <LoadingState text="Loading prescriptions..." />;

  return (
    <AppShell
      title={`Prescriptions | ${student?.name || `Student ${studentId}`}`}
      user={auth.user}
      plan={auth.plan}
      token={auth.token}
    >
      <div className="card">
        <h2 className="card-title">Actions</h2>
        <div className="btn-row">
          <button className="primary-btn" onClick={generatePrescription}>Generate From Latest Analysis</button>
          <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>Diagnosis</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/progress`}>Progress</Link>
        </div>
      </div>

      {studentError ? <div className="error-box">{studentError}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="ok-box">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard
          label="Plan"
          value={auth.plan}
          hint={auth.plan === 'FREE' ? 'Free tier shows limited prescription preview.' : 'Full prescription set enabled.'}
        />
        <MetricCard
          label="Expected Improvement"
          value={prescription?.expected_improvement_pct ? `${prescription.expected_improvement_pct}%` : 'N/A'}
          hint="Projected gain from current action plan"
        />
        <MetricCard
          label="Repetitions / Week"
          value={prescription?.recommended_repetitions_per_week || 'N/A'}
          hint="Recommended average cadence"
        />
        <MetricCard
          label="Items"
          value={prescription?.items?.length || 0}
          hint={auth.plan === 'FREE' ? 'Free tier preview (top 3).' : 'Full item list'}
        />
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Latest Prescription</h2>
        {!prescription ? (
          <p>No prescription found. Generate one from the latest analysis.</p>
        ) : (
          <>
            <p>{prescription.summary}</p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Drill Type</th>
                    <th>Goal</th>
                    <th>Frequency</th>
                    <th>Minutes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(prescription.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.priority_rank}</td>
                      <td>{item.drill_type}</td>
                      <td>{item.training_goal}</td>
                      <td>{item.frequency_per_week}/week</td>
                      <td>{item.estimated_minutes}</td>
                      <td>
                        <span className={`status-pill ${item.status}`}>{item.status}</span>
                      </td>
                      <td>
                        <div className="btn-row">
                          <button className="secondary-btn" onClick={() => updateItemStatus(item.id, 'todo')}>Todo</button>
                          <button className="secondary-btn" onClick={() => updateItemStatus(item.id, 'in_progress')}>In Progress</button>
                          <button className="secondary-btn" onClick={() => updateItemStatus(item.id, 'done')}>Done</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
