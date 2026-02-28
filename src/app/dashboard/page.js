'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest } from '@/lib/api';
import { useAuthGuard } from '@/lib/auth-client';

import {
  PlusCircle,
  ClipboardCheck,
  Activity,
  History,
  BaggageClaim,
  Zap,
  UserCircle,
  AlertTriangle,
  FileText,
  CreditCard
} from 'lucide-react';

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

  if (!auth.ready) return <LoadingState text="Preparing your dashboard..." />;

  return (
    <AppShell title="Learning Overview" user={auth.user} plan={auth.plan} token={auth.token}>
      <div className="card">
        <h2 className="card-title">
          <Zap size={20} className="text-accent" />
          Quick Actions
        </h2>
        {selectedStudent ? (
          <div className="two-col">
            <Link className="card hover-action" href={`/students/${selectedStudent.id}/reports/new`}>
              <PlusCircle size={24} color="var(--accent)" />
              <div>
                <strong>Analyze Report</strong>
                <p className="meta">Upload new student data</p>
              </div>
            </Link>
            <Link className="card hover-action" href={`/students/${selectedStudent.id}/diagnosis`}>
              <ClipboardCheck size={24} color="var(--accent-2)" />
              <div>
                <strong>Diagnosis</strong>
                <p className="meta">Review latest findings</p>
              </div>
            </Link>
            <Link className="card hover-action" href={`/students/${selectedStudent.id}/prescriptions`}>
              <Activity size={24} color="var(--warning)" />
              <div>
                <strong>Prescriptions</strong>
                <p className="meta">View recommended actions</p>
              </div>
            </Link>
          </div>
        ) : (
          <p className="meta">Select a student below to see personalized actions.</p>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">
          <UserCircle size={20} />
          Student Management
        </h2>
        <div className="form-grid">
          <label>
            Active Student
            <div className="input-with-icon">
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} • Grade {student.grade || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
          </label>
          {error ? <div className="error-box">{error}</div> : null}
          {!students.length ? (
            <div className="ok-box">
              No students found. Start by adding a student in the Students page.
            </div>
          ) : null}
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Plan Tier"
          value={auth.plan}
          icon={CreditCard}
          hint="Standard educational access."
        />
        <MetricCard
          label="Plateau Risk"
          value={alerts?.plateau_risk || 'Low'}
          icon={AlertTriangle}
          hint="Probability of learning stagnation."
        />
        <MetricCard
          label="Urgent Flags"
          value={alerts?.urgent_errors?.length || 0}
          icon={Activity}
          hint="Priority intervention areas."
        />
        <MetricCard
          label="Action Items"
          value={prescription?.items?.length || 0}
          icon={FileText}
          hint="Tasks in current prescription."
        />
      </div>

      <div className="card">
        <h2 className="card-title">
          <ClipboardCheck size={20} />
          Latest Diagnosis Snapshot
        </h2>
        {!diagnostics ? (
          <div className="loading-wrap" style={{ minHeight: '100px' }}>
            <p className="meta">No analysis data available yet.</p>
          </div>
        ) : (
          <div className="form-grid">
            <div className="two-col" style={{ alignItems: 'center' }}>
              <p className="meta">Generated: <span className="mono">{diagnostics.generated_at}</span></p>
              <div style={{ justifySelf: 'end' }}>
                <span className={`status-pill ${(diagnostics.plateau_risk || 'LOW').toLowerCase()}`}>
                  Risk: {diagnostics.plateau_risk || 'LOW'}
                </span>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Learning Area</th>
                    <th>Frequency</th>
                    <th>Dominance</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {(diagnostics.error_stats || diagnostics.error_overview || []).slice(0, 5).map((row, idx) => (
                    <tr key={`${row.error_type_id || idx}`}>
                      <td><strong>{row.label || row.error_code || 'General'}</strong></td>
                      <td>{row.error_count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${(row.dominance_ratio || 0) * 100}%` }}
                            />
                          </div>
                          <span className="meta">{((row.dominance_ratio || 0) * 100).toFixed(0)}%</span>
                        </div>
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
        )}
      </div>
    </AppShell>
  );
}
    </AppShell>
  );
}
