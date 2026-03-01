'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest, getApiErrorMessage } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';
import { normalizeDiagnosis } from '@/lib/view-models';

export default function DiagnosisPage({ params }) {
  const { id: studentId } = use(params);
  const { auth, student, error: studentError } = useStudentPage(studentId);
  const [diagnostics, setDiagnostics] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setError('');
    const [diag, reports] = await Promise.all([
      apiRequest(`/students/${studentId}/diagnostics/latest`, { token: auth.token }),
      apiRequest(`/students/${studentId}/reports`, { token: auth.token }),
    ]);

    if (diag.ok) {
      setDiagnostics(diag.data);
    } else {
      setDiagnostics(null);
      setError(getApiErrorMessage(diag, 'Unable to load diagnosis.'));
    }

    if (reports.ok && reports.data?.length) {
      setLatestReport(reports.data[0]);
    } else {
      setLatestReport(null);
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
      setError(getApiErrorMessage(response, 'Analysis failed.'));
      return;
    }

    setMessage(`Analysis ${response.data.id} generated.`);
    loadData();
  }

  if (!auth.ready) return <LoadingState text="Loading diagnosis..." />;

  const diagnosis = normalizeDiagnosis(diagnostics);
  const errorStats = diagnosis.error_stats;
  const skillStats = diagnosis.skill_stats;
  const aiSummary = diagnosis.ai_summary || null;
  const aiStatus = diagnosis.ai_status || 'SKIPPED';
  const aiStatusTone = aiStatus === 'DONE' ? 'low' : aiStatus === 'FAILED' ? 'high' : 'medium';

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
          value={diagnosis.plateau_risk || 'N/A'}
          hint="Risk of slow improvement trend"
        />
        <MetricCard
          label="Cognitive Load"
          value={diagnosis.cognitive_load_indicator ?? 'Limited'}
          hint={auth.plan === 'FREE' ? 'Upgrade to Standard for full diagnostics.' : 'Composite 0-100 score'}
        />
        <MetricCard
          label="Time Efficiency"
          value={diagnosis.time_efficiency_index ?? 'Limited'}
          hint={auth.plan === 'FREE' ? 'Free tier hides advanced metrics.' : 'Correct per minute normalized index'}
        />
        <MetricCard
          label="Predicted Band"
          value={
            diagnosis.predicted_band_low !== undefined
              ? `${diagnosis.predicted_band_low} - ${diagnosis.predicted_band_high}`
              : 'Hidden'
          }
          hint={auth.plan === 'FREE' ? 'Free tier hides projected score band.' : 'Projected score range'}
        />
      </div>

      <div className="card">
        <h2 className="card-title">Cloudflare AI Report Summary</h2>
        {diagnosis.empty ? (
          <EmptyState
            title="No diagnosis summary yet"
            description="Run analysis after a report has been finalized to populate AI summary, error patterns, and next-step guidance."
          />
        ) : (
          <>
            <p>
              Status:{' '}
              <span className={`status-pill ${aiStatusTone}`}>
                {aiStatus}
              </span>
            </p>
            {diagnosis.ai_model ? (
              <p>
                Model: <span className="mono">{diagnosis.ai_model}</span>
              </p>
            ) : null}
          </>
        )}
        {!diagnosis.empty && aiSummary ? (
          <div className="form-grid compact-gap">
            {aiSummary.summary ? <p>{aiSummary.summary}</p> : null}
            {aiSummary.strengths?.length ? (
              <div>
                <strong>Strengths</strong>
                <ul>
                  {aiSummary.strengths.map((item, idx) => (
                    <li key={`strength-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {aiSummary.focus_areas?.length ? (
              <div>
                <strong>Focus Areas</strong>
                <ul>
                  {aiSummary.focus_areas.map((item, idx) => (
                    <li key={`focus-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {aiSummary.next_week_plan?.length ? (
              <div>
                <strong>Next Week Plan</strong>
                <ul>
                  {aiSummary.next_week_plan.map((item, idx) => (
                    <li key={`plan-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {aiSummary.parent_note ? (
              <p>
                <strong>Parent Note:</strong> {aiSummary.parent_note}
              </p>
            ) : null}
          </div>
        ) : !diagnosis.empty ? (
          <p>AI summary is not available yet. Run analysis after report mapping and finalization.</p>
        ) : null}
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
              {errorStats.length ? errorStats.map((row, index) => (
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
              )) : (
                <tr>
                  <td colSpan="5">No error distribution data yet.</td>
                </tr>
              )}
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
              {skillStats.length ? skillStats.map((row, index) => (
                <tr key={`${row.skill_code || index}`}>
                  <td>{row.skill_code}</td>
                  <td>{row.skill_ratio !== undefined ? `${(Number(row.skill_ratio) * 100).toFixed(1)}%` : '-'}</td>
                  <td>
                    <span className={`status-pill ${(row.urgency_level || 'LOW').toLowerCase()}`}>
                      {row.urgency_level || 'LOW'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3">No skill balance data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
