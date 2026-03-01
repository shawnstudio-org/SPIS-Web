'use client';

import Link from 'next/link';
import { use, useMemo, useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import { apiRequest } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';

const emptySection = {
  subject: '',
  section_name: '',
  score_raw: '',
  score_total: '',
  time_minutes: '',
  notes: '',
};

const emptyAttempt = {
  question_no: '',
  subject: '',
  question_type: '',
  difficulty: '3',
  is_correct: false,
  time_seconds: '',
  error_type_id: '',
  error_notes: '',
};

export default function NewReportPage({ params }) {
  const { id: studentId } = use(params);
  const { auth, student, error: studentError, setError: setStudentError } = useStudentPage(studentId);

  const [step, setStep] = useState(1);
  const [reportId, setReportId] = useState(null);
  const [reportMeta, setReportMeta] = useState({
    exam_name: '',
    exam_date: '',
    provider_name: '',
    exam_type: '',
    score_total: '',
    percentile: '',
    duration_minutes: '',
  });
  const [file, setFile] = useState(null);
  const [writingSummary, setWritingSummary] = useState('');
  const [sections, setSections] = useState([{ ...emptySection }]);
  const [attempts, setAttempts] = useState([{ ...emptyAttempt }]);
  const [taxonomy, setTaxonomy] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.ready) return;
    const run = async () => {
      const response = await apiRequest('/taxonomy', { token: auth.token });
      if (response.ok) {
        setTaxonomy(response.data || []);
      }
    };
    run();
  }, [auth.ready, auth.token]);

  const taxonomyOptions = useMemo(
    () => taxonomy.map((row) => ({ value: row.id, label: `${row.subject} / ${row.label}` })),
    [taxonomy],
  );

  if (!auth.ready) return <LoadingState text="Loading report intake..." />;

  async function createReport() {
    setError('');
    setMessage('');

    const response = await apiRequest('/reports', {
      method: 'POST',
      token: auth.token,
      body: {
        student_id: Number(studentId),
        exam_name: reportMeta.exam_name || null,
        exam_date: reportMeta.exam_date || null,
        provider_name: reportMeta.provider_name || null,
        exam_type: reportMeta.exam_type || null,
        score_total: reportMeta.score_total ? Number(reportMeta.score_total) : null,
        percentile: reportMeta.percentile ? Number(reportMeta.percentile) : null,
        duration_minutes: reportMeta.duration_minutes ? Number(reportMeta.duration_minutes) : null,
      },
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to create report');
      return null;
    }

    return response.data.id;
  }

  async function uploadFile(targetReportId) {
    if (!file) return true;

    const formData = new FormData();
    formData.append('file', file);

    const response = await apiRequest(`/reports/${targetReportId}/file`, {
      method: 'POST',
      token: auth.token,
      body: formData,
      isForm: true,
    });

    if (!response.ok) {
      setError(response.data?.error || 'File upload failed');
      return false;
    }

    return true;
  }

  async function submitStep1(event) {
    event.preventDefault();

    const createdReportId = await createReport();
    if (!createdReportId) return;

    const uploaded = await uploadFile(createdReportId);
    if (!uploaded) return;

    setReportId(createdReportId);
    setStep(2);
    setMessage('Report metadata saved. Continue with manual mapping.');
  }

  async function submitStep2(event) {
    event.preventDefault();
    if (!reportId) {
      setError('Report ID missing. Start from step 1.');
      return;
    }

    const normalizedSections = sections
      .filter((row) => row.subject || row.section_name)
      .map((row) => ({
        subject: row.subject || null,
        section_name: row.section_name || null,
        score_raw: row.score_raw === '' ? null : Number(row.score_raw),
        score_total: row.score_total === '' ? null : Number(row.score_total),
        time_minutes: row.time_minutes === '' ? null : Number(row.time_minutes),
        notes: row.notes || null,
      }));

    const normalizedAttempts = attempts
      .filter((row) => row.question_no)
      .map((row) => ({
        question_no: Number(row.question_no),
        subject: row.subject || null,
        question_type: row.question_type || null,
        difficulty: row.difficulty ? Number(row.difficulty) : 3,
        is_correct: !!row.is_correct,
        time_seconds: row.time_seconds === '' ? null : Number(row.time_seconds),
        error_type_id: row.error_type_id ? Number(row.error_type_id) : null,
        error_notes: row.error_notes || null,
      }));

    const response = await apiRequest(`/reports/${reportId}/manual-input`, {
      method: 'PATCH',
      token: auth.token,
      body: {
        sections: normalizedSections,
        attempts: normalizedAttempts,
        writing_summary: writingSummary || null,
      },
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to save manual input');
      return;
    }

    setStep(3);
    setMessage('Manual mapping saved. Review and finalize report.');
  }

  async function finalizeReport() {
    if (!reportId) return;

    const response = await apiRequest(`/reports/${reportId}/complete`, {
      method: 'POST',
      token: auth.token,
    });

    if (!response.ok) {
      setError(response.data?.error || 'Unable to finalize report');
      return;
    }

    setMessage('Report finalized. You can run analysis now.');
  }

  function updateSection(index, key, value) {
    setSections((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  }

  function updateAttempt(index, key, value) {
    setAttempts((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  }

  return (
    <AppShell
      title={`New Report Intake | ${student?.name || `Student ${studentId}`}`}
      user={auth.user}
      plan={auth.plan}
      token={auth.token}
    >
      <div className="card form-grid">
        <h2 className="card-title">Workflow</h2>
        <p>
          Step {step} of 3
          {reportId ? ` | Report ID: ${reportId}` : ''}
        </p>
        <div className="btn-row">
          <button className="secondary-btn" onClick={() => setStep(1)}>Step 1: Metadata + Upload</button>
          <button className="secondary-btn" onClick={() => setStep(2)} disabled={!reportId}>Step 2: Manual Mapping</button>
          <button className="secondary-btn" onClick={() => setStep(3)} disabled={!reportId}>Step 3: Finalize</button>
        </div>
      </div>

      {studentError ? <div className="error-box">{studentError}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="ok-box">{message}</div> : null}

      {step === 1 ? (
        <div className="card form-grid">
          <h2 className="card-title">Step 1: Report Metadata and File Upload</h2>
          <form className="form-grid" onSubmit={submitStep1}>
            <div className="two-col">
              <label>
                Exam name
                <input
                  value={reportMeta.exam_name}
                  onChange={(event) => setReportMeta((prev) => ({ ...prev, exam_name: event.target.value }))}
                />
              </label>
              <label>
                Exam date
                <input
                  type="date"
                  value={reportMeta.exam_date}
                  onChange={(event) => setReportMeta((prev) => ({ ...prev, exam_date: event.target.value }))}
                />
              </label>
              <label>
                Provider
                <input
                  value={reportMeta.provider_name}
                  onChange={(event) => setReportMeta((prev) => ({ ...prev, provider_name: event.target.value }))}
                  placeholder="PreUni / CTedu"
                />
              </label>
              <label>
                Exam type
                <input
                  value={reportMeta.exam_type}
                  onChange={(event) => setReportMeta((prev) => ({ ...prev, exam_type: event.target.value }))}
                  placeholder="OC / Selective"
                />
              </label>
              <label>
                Total score
                <input
                  type="number"
                  value={reportMeta.score_total}
                  onChange={(event) => setReportMeta((prev) => ({ ...prev, score_total: event.target.value }))}
                />
              </label>
              <label>
                Percentile
                <input
                  type="number"
                  step="0.01"
                  value={reportMeta.percentile}
                  onChange={(event) => setReportMeta((prev) => ({ ...prev, percentile: event.target.value }))}
                />
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  step="1"
                  value={reportMeta.duration_minutes}
                  onChange={(event) => setReportMeta((prev) => ({ ...prev, duration_minutes: event.target.value }))}
                />
              </label>
              <label>
                Upload file (PDF/image)
                <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
            </div>

            <button className="primary-btn" type="submit">
              Save Step 1
            </button>
          </form>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="card form-grid">
          <h2 className="card-title">Step 2: Manual Data Mapping</h2>
          <form className="form-grid" onSubmit={submitStep2}>
            <h3>Sections</h3>
            {sections.map((section, index) => (
              <div key={`section-${index}`} className="card">
                <div className="two-col">
                  <label>
                    Subject
                    <input
                      value={section.subject}
                      onChange={(event) => updateSection(index, 'subject', event.target.value)}
                      placeholder="READING / THINKING_SKILLS / WRITING"
                    />
                  </label>
                  <label>
                    Section name
                    <input
                      value={section.section_name}
                      onChange={(event) => updateSection(index, 'section_name', event.target.value)}
                      placeholder="Cloze / Multiple Match"
                    />
                  </label>
                  <label>
                    Score raw
                    <input
                      type="number"
                      value={section.score_raw}
                      onChange={(event) => updateSection(index, 'score_raw', event.target.value)}
                    />
                  </label>
                  <label>
                    Score total
                    <input
                      type="number"
                      value={section.score_total}
                      onChange={(event) => updateSection(index, 'score_total', event.target.value)}
                    />
                  </label>
                  <label>
                    Time minutes
                    <input
                      type="number"
                      value={section.time_minutes}
                      onChange={(event) => updateSection(index, 'time_minutes', event.target.value)}
                    />
                  </label>
                  <label>
                    Notes
                    <input
                      value={section.notes}
                      onChange={(event) => updateSection(index, 'notes', event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
            <button className="secondary-btn" type="button" onClick={() => setSections((prev) => [...prev, { ...emptySection }])}>
              Add Section
            </button>

            <h3>Question Attempts</h3>
            {attempts.map((attempt, index) => (
              <div key={`attempt-${index}`} className="card">
                <div className="two-col">
                  <label>
                    Question no
                    <input
                      type="number"
                      value={attempt.question_no}
                      onChange={(event) => updateAttempt(index, 'question_no', event.target.value)}
                    />
                  </label>
                  <label>
                    Subject
                    <input
                      value={attempt.subject}
                      onChange={(event) => updateAttempt(index, 'subject', event.target.value)}
                    />
                  </label>
                  <label>
                    Question type
                    <input
                      value={attempt.question_type}
                      onChange={(event) => updateAttempt(index, 'question_type', event.target.value)}
                      placeholder="Cloze / Multiple Match / Thinking"
                    />
                  </label>
                  <label>
                    Difficulty (1-7)
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={attempt.difficulty}
                      onChange={(event) => updateAttempt(index, 'difficulty', event.target.value)}
                    />
                  </label>
                  <label>
                    Time seconds
                    <input
                      type="number"
                      value={attempt.time_seconds}
                      onChange={(event) => updateAttempt(index, 'time_seconds', event.target.value)}
                    />
                  </label>
                  <label>
                    Error type
                    <select
                      value={attempt.error_type_id}
                      onChange={(event) => updateAttempt(index, 'error_type_id', event.target.value)}
                    >
                      <option value="">None</option>
                      {taxonomyOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Error notes
                    <input
                      value={attempt.error_notes}
                      onChange={(event) => updateAttempt(index, 'error_notes', event.target.value)}
                    />
                  </label>
                  <label>
                    Correct?
                    <select
                      value={attempt.is_correct ? '1' : '0'}
                      onChange={(event) => updateAttempt(index, 'is_correct', event.target.value === '1')}
                    >
                      <option value="0">Wrong</option>
                      <option value="1">Correct</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
            <button className="secondary-btn" type="button" onClick={() => setAttempts((prev) => [...prev, { ...emptyAttempt }])}>
              Add Attempt
            </button>

            <label>
              Writing feedback summary
              <textarea
                value={writingSummary}
                onChange={(event) => setWritingSummary(event.target.value)}
                placeholder="Teacher notes, writing score summary, prompt feedback..."
              />
            </label>

            <button className="primary-btn" type="submit">
              Save Step 2
            </button>
          </form>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="card form-grid">
          <h2 className="card-title">Step 3: Finalize and Continue</h2>
          <p>Finalize report entry, then run deterministic analysis and move to diagnosis/prescription pages.</p>
          <div className="btn-row">
            <button className="primary-btn" onClick={finalizeReport}>Finalize Report</button>
            {reportId ? <Link className="secondary-btn" href={`/students/${studentId}/reports`}>View Report History</Link> : null}
            {reportId ? (
              <button
                className="secondary-btn"
                onClick={async () => {
                  const response = await apiRequest(`/reports/${reportId}/analyze`, {
                    method: 'POST',
                    token: auth.token,
                  });
                  if (!response.ok) {
                    setError(response.data?.error || 'Analysis failed');
                    return;
                  }
                  setMessage(`Analysis generated (ID ${response.data.id}).`);
                }}
              >
                Run Analysis
              </button>
            ) : null}
            <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>Go to Diagnosis</Link>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h2 className="card-title">Navigation</h2>
        <div className="btn-row">
          <Link className="secondary-btn" href={`/students/${studentId}/reports`}>Reports</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>Diagnosis</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/prescriptions`}>Prescriptions</Link>
          <Link className="secondary-btn" href={`/students/${studentId}/progress`}>Progress</Link>
        </div>
      </div>
    </AppShell>
  );
}
