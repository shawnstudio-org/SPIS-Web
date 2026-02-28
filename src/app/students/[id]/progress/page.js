'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';

export default function ProgressPage({ params }) {
  const studentId = params.id;
  const { auth, student, error: studentError } = useStudentPage(studentId);
  const [range, setRange] = useState('12w');
  const [progress, setProgress] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData(currentRange = range) {
    const [prog, alert] = await Promise.all([
      apiRequest(`/students/${studentId}/progress?range=${currentRange}`, { token: auth.token }),
      apiRequest(`/students/${studentId}/alerts/latest`, { token: auth.token }),
    ]);

    if (prog.ok) {
      setProgress(prog.data);
    } else {
      setError(prog.data?.error || 'Unable to load progress');
    }

    if (alert.ok) {
      setAlerts(alert.data);
    }
  }

  useEffect(() => {
    if (!auth.ready) return;
    loadData();
  }, [auth.ready]);

  async function createWeeklyAdjustment() {
    setError('');
    setMessage('');

    const response = await apiRequest(`/students/${studentId}/weekly-adjustment`, {
      method: 'POST',
      token: auth.token,
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to generate weekly adjustment');
      return;
    }

    setMessage('Weekly adjustment generated.');
    loadData();
  }

  if (!auth.ready) return <LoadingState text="Loading progress..." />;

  const snapshots = progress?.snapshots || [];
  const latest = progress?.latest;

  return (
    <AppShell
      title={`Progress | ${student?.name || `Student ${studentId}`}`}
      user={auth.user}
      plan={auth.plan}
      token={auth.token}
    >
      <div className="card">
        <h2 className="card-title">Controls</h2>
        <div className="btn-row">
          <select
            value={range}
            onChange={(event) => {
              setRange(event.target.value);
              loadData(event.target.value);
            }}
          >
            <option value="4w">Last 4 weeks</option>
            <option value="8w">Last 8 weeks</option>
            <option value="12w">Last 12 weeks</option>
            <option value="24w">Last 24 weeks</option>
          </select>
          <button className="primary-btn" onClick={createWeeklyAdjustment}>
            Generate Weekly Adjustment
          </button>
          <Link className="secondary-btn" href={`/students/${studentId}/prescriptions`}>Prescriptions</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>Diagnosis</Link>
        </div>
      </div>

      {studentError ? <div className="error-box">{studentError}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="ok-box">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard
          label="Snapshots"
          value={snapshots.length}
          hint="Historical progress points"
        />
        <MetricCard
          label="Latest Error Reduction"
          value={latest?.error_reduction_pct !== undefined ? `${latest.error_reduction_pct}%` : 'N/A'}
          hint="Change vs previous analysis snapshot"
        />
        <MetricCard
          label="Study Efficiency"
          value={latest?.study_efficiency_score !== undefined ? latest.study_efficiency_score : 'N/A'}
          hint="Composite efficiency score"
        />
        <MetricCard
          label="Plateau Risk"
          value={alerts?.plateau_risk || latest?.plateau_warning || 'N/A'}
          hint="High risk signals stagnation"
        />
      </div>

      <div className="card">
        <h2 className="card-title">Error Reduction Curve</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Error Reduction</th>
                <th>Skill Balance</th>
                <th>Efficiency</th>
                <th>Predicted Band</th>
                <th>Plateau</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((row, index) => (
                <tr key={`${row.snapshot_date}-${index}`}>
                  <td>{row.snapshot_date}</td>
                  <td>{row.error_reduction_pct !== null ? `${row.error_reduction_pct}%` : '-'}</td>
                  <td>{row.skill_balance_score !== null ? row.skill_balance_score : '-'}</td>
                  <td>{row.study_efficiency_score !== null ? row.study_efficiency_score : '-'}</td>
                  <td>
                    {row.predicted_band_low !== null && row.predicted_band_low !== undefined
                      ? `${row.predicted_band_low} - ${row.predicted_band_high}`
                      : 'Hidden'}
                  </td>
                  <td>
                    <span className={`status-pill ${(row.plateau_warning || 'LOW').toLowerCase()}`}>
                      {row.plateau_warning || 'LOW'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Latest Alerts</h2>
        {!alerts ? (
          <p>No alerts generated yet.</p>
        ) : (
          <>
            <p>Plateau risk: <span className={`status-pill ${(alerts.plateau_risk || 'LOW').toLowerCase()}`}>{alerts.plateau_risk}</span></p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Error</th>
                    <th>Urgency</th>
                    <th>Weighted</th>
                  </tr>
                </thead>
                <tbody>
                  {(alerts.urgent_errors || []).map((row, index) => (
                    <tr key={`${row.error_code || index}`}>
                      <td>{row.label || row.error_code}</td>
                      <td>
                        <span className={`status-pill ${(row.urgency_level || 'LOW').toLowerCase()}`}>
                          {row.urgency_level || 'LOW'}
                        </span>
                      </td>
                      <td>{row.weighted_score}</td>
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
