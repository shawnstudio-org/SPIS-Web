'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import { apiRequest } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';

export default function StudentReportsPage({ params }) {
  const studentId = params.id;
  const { auth, student, error: studentError } = useStudentPage(studentId);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadReports() {
    const response = await apiRequest(`/students/${studentId}/reports`, { token: auth.token });
    if (!response.ok) {
      setError(response.data?.error || 'Unable to load reports');
      return;
    }
    setReports(response.data || []);
  }

  useEffect(() => {
    if (!auth.ready) return;
    loadReports();
  }, [auth.ready]);

  async function finalizeReport(reportId) {
    setError('');
    setMessage('');
    const response = await apiRequest(`/reports/${reportId}/complete`, {
      method: 'POST',
      token: auth.token,
    });
    if (!response.ok) {
      setError(response.data?.error || 'Unable to finalize report');
      return;
    }
    setMessage(`Report ${reportId} finalized.`);
    loadReports();
  }

  async function runAnalysis(reportId) {
    setError('');
    setMessage('');
    const response = await apiRequest(`/reports/${reportId}/analyze`, {
      method: 'POST',
      token: auth.token,
    });
    if (!response.ok) {
      setError(response.data?.error || 'Analysis failed');
      return;
    }
    setMessage(`Analysis ${response.data.id} generated.`);
    loadReports();
  }

  if (!auth.ready) return <LoadingState text="Loading reports..." />;

  return (
    <AppShell
      title={`Reports | ${student?.name || `Student ${studentId}`}`}
      user={auth.user}
      plan={auth.plan}
      token={auth.token}
    >
      <div className="card">
        <h2 className="card-title">Report History</h2>
        <div className="btn-row" style={{ marginBottom: 12 }}>
          <Link className="primary-btn" href={`/students/${studentId}/reports/new`}>New Report Intake</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>Diagnosis</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/prescriptions`}>Prescriptions</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/progress`}>Progress</Link>
        </div>

        {studentError ? <div className="error-box">{studentError}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}
        {message ? <div className="ok-box">{message}</div> : null}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Exam</th>
                <th>Date</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="mono">{report.id}</td>
                  <td>{report.exam_name || '-'}</td>
                  <td>{report.exam_date || '-'}</td>
                  <td>{report.provider_name || '-'}</td>
                  <td>
                    <div className="form-grid" style={{ gap: 6 }}>
                      <span className="status-pill low">Entry: {report.entry_status || '-'}</span>
                      <span className="status-pill medium">Analysis: {report.analysis_status || '-'}</span>
                    </div>
                  </td>
                  <td>{report.score_total ?? '-'} / {report.percentile ? `${report.percentile}%` : '-'}</td>
                  <td>
                    <div className="btn-row">
                      <button className="secondary-btn" onClick={() => finalizeReport(report.id)}>Finalize</button>
                      <button className="secondary-btn" onClick={() => runAnalysis(report.id)}>Analyze</button>
                      <button
                        className="secondary-btn"
                        onClick={async () => {
                          const response = await apiRequest(`/reports/${report.id}`, { token: auth.token });
                          if (!response.ok) {
                            setError(response.data?.error || 'Unable to fetch details');
                            return;
                          }
                          const detail = response.data;
                          setMessage(
                            `Report ${detail.id}: ${detail.sections?.length || 0} sections, ${detail.attempts?.length || 0} attempts, ${detail.files?.length || 0} file(s).`,
                          );
                        }}
                      >
                        Inspect
                      </button>
                    </div>
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
