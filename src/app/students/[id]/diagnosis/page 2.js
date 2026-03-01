'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';

export default function DiagnosisPage({ params }) {
  const studentId = params.id;
  const { auth, student, error: studentError } = useStudentPage(studentId);
  const [diagnostics, setDiagnostics] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    const [diag, reports] = await Promise.all([
      apiRequest(`/students/${studentId}/diagnostics/latest`, { token: auth.token }),
      apiRequest(`/students/${studentId}/reports`, { token: auth.token }),
    ]);

    if (diag.ok) {
      setDiagnostics(diag.data);
    } else {
      setError(diag.data?.error || 'Unable to load diagnosis');
    }

    if (reports.ok && reports.data?.length) {
      setLatestReport(reports.data[0]);
    }
  }

  useEffect(() => {
    if (!auth.ready) return;
    loadData();
  }, [auth.ready]);

  async function runAnalysis() {
    if (!latestReport) {
      setError('No report available for analysis.');
      return;
    }

    setError('');
    setMessage('');

    const response = await apiRequest(`/reports/${latestReport.id}/analyze`, {
      method: 'POST',
      token: auth.token,
    });

    if (!response.ok) {
      setError(response.data?.error || 'Analysis failed');
      return;
    }

    setMessage(`Analysis ${response.data.id} generated.`);
    loadData();
  }

  if (!auth.ready) return <LoadingState text="Loading diagnosis..." />;

  const errorStats = diagnostics?.error_stats || diagnostics?.error_overview || [];
  const skillStats = diagnostics?.skill_stats || diagnostics?.skill_map || [];

  return (
    <AppShell
      title={`Diagnosis | ${student?.name || `Student ${studentId}`}`}
      user={auth.user}
      plan={auth.plan}
      token={auth.token}
    >
      <div className="card">
        <h2 className="card-title">Actions</h2>
        <div className="btn-row">
          <button className="primary-btn" onClick={runAnalysis}>Run Analysis on Latest Report</button>
          <Link className="secondary-btn" href={`/students/${studentId}/reports`}>Report History</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/prescriptions`}>Prescriptions</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/progress`}>Progress</Link>
        </div>
      </div>

      {studentError ? <div className="error-box">{studentError}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="ok-box">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard
          label="Plateau Risk"
          value={diagnostics?.plateau_risk || 'N/A'}
          hint="Risk of slow improvement trend"
        />
        <MetricCard
          label="Cognitive Load"
          value={diagnostics?.cognitive_load_indicator ?? 'Limited'}
          hint={auth.plan === 'FREE' ? 'Upgrade to Standard for full diagnostics.' : 'Composite 0-100 score'}
        />
        <MetricCard
          label="Time Efficiency"
          value={diagnostics?.time_efficiency_index ?? 'Limited'}
          hint={auth.plan === 'FREE' ? 'Free tier hides advanced metrics.' : 'Correct per minute normalized index'}
        />
        <MetricCard
          label="Predicted Band"
          value={
            diagnostics?.predicted_band_low !== undefined
              ? `${diagnostics.predicted_band_low} - ${diagnostics.predicted_band_high}`
              : 'Hidden'
          }
          hint={auth.plan === 'FREE' ? 'Free tier hides projected score band.' : 'Projected score range'}
        />
      </div>

      <div className="card">
        <h2 className="card-title">Error Distribution Heatmap (table)</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Error</th>
                <th>Count</th>
                <th>Weighted</th>
                <th>Dominance</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {errorStats.map((row, index) => (
                <tr key={`${row.error_type_id || index}`}>
                  <td>{row.label || row.error_code || 'Unclassified'}</td>
                  <td>{row.error_count || '-'}</td>
                  <td>{row.weighted_score || '-'}</td>
                  <td>
                    {row.dominance_ratio !== undefined
                      ? `${(Number(row.dominance_ratio) * 100).toFixed(1)}%`
                      : '-'}
                  </td>
                  <td>
                    <span className={`status-pill ${(row.urgency_level || 'LOW').toLowerCase()}`}>
                      {row.urgency_level || 'LOW'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Skill Dominance Radar (table projection)</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Ratio</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {skillStats.map((row, index) => (
                <tr key={`${row.skill_code || index}`}>
                  <td>{row.skill_code}</td>
                  <td>{row.skill_ratio !== undefined ? `${(Number(row.skill_ratio) * 100).toFixed(1)}%` : '-'}</td>
                  <td>
                    <span className={`status-pill ${(row.urgency_level || 'LOW').toLowerCase()}`}>
                      {row.urgency_level || 'LOW'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
