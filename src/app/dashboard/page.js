'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest } from '@/lib/api';
import { useAuthGuard } from '@/lib/auth-client';

export default function DashboardPage() {
  const auth = useAuthGuard();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.ready) return;

    const run = async () => {
      const response = await apiRequest('/students', { token: auth.token });
      if (!response.ok) {
        setError(response.data?.error || 'Unable to load students');
        return;
      }

      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudentId(String(response.data[0].id));
      }
    };

    run();
  }, [auth.ready, auth.token]);

  useEffect(() => {
    if (!auth.ready || !selectedStudentId) return;

    const run = async () => {
      const [diag, pres, alert] = await Promise.all([
        apiRequest(`/students/${selectedStudentId}/diagnostics/latest`, { token: auth.token }),
        apiRequest(`/students/${selectedStudentId}/prescriptions/latest`, { token: auth.token }),
        apiRequest(`/students/${selectedStudentId}/alerts/latest`, { token: auth.token }),
      ]);

      setDiagnostics(diag.ok ? diag.data : null);
      setPrescription(pres.ok ? pres.data : null);
      setAlerts(alert.ok ? alert.data : null);
    };

    run();
  }, [auth.ready, auth.token, selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((row) => String(row.id) === String(selectedStudentId)) || null,
    [students, selectedStudentId],
  );

  if (!auth.ready) return <LoadingState text="Loading dashboard..." />;

  return (
    <AppShell title="Parent Dashboard" user={auth.user} plan={auth.plan} token={auth.token}>
      <div className="card form-grid">
        <h2 className="card-title">Student Switcher</h2>
        <label>
          Active student
          <select
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.grade || 'No grade'})
              </option>
            ))}
          </select>
        </label>
        {error ? <div className="error-box">{error}</div> : null}
        {!students.length ? (
          <div className="ok-box">
            No students yet. Create one from the Students page to begin report analysis.
          </div>
        ) : null}
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Current Plan"
          value={auth.plan}
          hint="Manual tier assignment (payment disabled)."
        />
        <MetricCard
          label="Plateau Risk"
          value={alerts?.plateau_risk || 'N/A'}
          hint="High risk triggers weekly adjustment attention."
        />
        <MetricCard
          label="Top Urgent Errors"
          value={alerts?.urgent_errors?.length || 0}
          hint="Latest analysis urgency list."
        />
        <MetricCard
          label="Prescription Items"
          value={prescription?.items?.length || 0}
          hint="Latest generated action plan count."
        />
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Quick Actions</h2>
        {selectedStudent ? (
          <div className="btn-row">
            <Link className="primary-btn" href={`/students/${selectedStudent.id}/reports/new`}>
              New Report Input
            </Link>
            <Link className="secondary-btn" href={`/students/${selectedStudent.id}/reports`}>
              Report History
            </Link>
            <Link className="secondary-btn" href={`/students/${selectedStudent.id}/diagnosis`}>
              Diagnosis
            </Link>
            <Link className="secondary-btn" href={`/students/${selectedStudent.id}/prescriptions`}>
              Prescriptions
            </Link>
            <Link className="secondary-btn" href={`/students/${selectedStudent.id}/progress`}>
              Progress
            </Link>
            <Link className="secondary-btn" href={`/students/${selectedStudent.id}/strategy`}>
              Premium Strategy
            </Link>
          </div>
        ) : (
          <p>Select a student first.</p>
        )}
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Latest Diagnosis Snapshot</h2>
        {!diagnostics ? (
          <p>No analysis data yet for this student.</p>
        ) : (
          <>
            <p>Generated at: <span className="mono">{diagnostics.generated_at || 'N/A'}</span></p>
            <p>Plateau risk: <span className={`status-pill ${(diagnostics.plateau_risk || 'LOW').toLowerCase()}`}>{diagnostics.plateau_risk || 'LOW'}</span></p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Error Type</th>
                    <th>Count</th>
                    <th>Dominance</th>
                    <th>Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {(diagnostics.error_stats || diagnostics.error_overview || []).slice(0, 5).map((row, idx) => (
                    <tr key={`${row.error_type_id || idx}`}>
                      <td>{row.label || row.error_code || 'Unclassified'}</td>
                      <td>{row.error_count}</td>
                      <td>{row.dominance_ratio ? `${(row.dominance_ratio * 100).toFixed(1)}%` : '-'}</td>
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
          </>
        )}
      </div>
    </AppShell>
  );
}
