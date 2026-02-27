'use client';

import Link from 'next/link';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import { apiRequest } from '@/lib/api';
import { useStudentPage } from '@/lib/use-student-page';

const initialForm = {
  exam_name: '',
  exam_date: '',
  provider_name: '',
  exam_type: '',
  duration_minutes: '',
  score_chinese: '',
  score_english: '',
  score_math: '',
  score_thinking: '',
  rank_position: '',
  rank_total: '',
  percentile: '',
};

export default function NewReportPage({ params }) {
  const studentId = params.id;
  const { auth, student, error: studentError } = useStudentPage(studentId);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!auth.ready) return <LoadingState text="Loading quick analysis..." />;

  const aiSummary = result?.analysis?.ai_summary || null;

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateRequired() {
    if (!file) return 'Please upload a report file or photo.';
    if (!form.score_chinese || !form.score_english || !form.score_math || !form.score_thinking) {
      return 'Please enter all four subject scores.';
    }
    return null;
  }

  async function submitQuickAnalyze(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const validationError = validateRequired();
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        formData.set(key, value);
      }
    });
    formData.set('file', file);

    setSubmitting(true);
    const response = await apiRequest(`/students/${studentId}/reports/quick-analyze`, {
      method: 'POST',
      token: auth.token,
      body: formData,
      isForm: true,
    });
    setSubmitting(false);

    if (!response.ok) {
      setError(response.data?.error || 'Quick analysis failed');
      return;
    }

    setResult(response.data);
    setMessage(`Quick analysis completed. Report #${response.data.report_id}, Analysis #${response.data.analysis_id}.`);
  }

  return (
    <AppShell
      title={`Quick Report Analysis | ${student?.name || `Student ${studentId}`}`}
      user={auth.user}
      plan={auth.plan}
      token={auth.token}
    >
      <div className="card form-grid">
        <h2 className="card-title">One-Step Flow</h2>
        <p>Enter 4 subject scores, optional ranking, upload report photo/file, then run AI analysis.</p>
        <div className="btn-row">
          <Link className="secondary-btn" href={`/students/${studentId}/reports/new/advanced`}>
            Advanced Manual Mapping
          </Link>
          <Link className="secondary-btn" href={`/students/${studentId}/reports`}>
            Report History
          </Link>
          <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>
            Diagnosis
          </Link>
        </div>
      </div>

      {studentError ? <div className="error-box">{studentError}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="ok-box">{message}</div> : null}

      <div className="card form-grid">
        <h2 className="card-title">Report Input</h2>
        <form className="form-grid" onSubmit={submitQuickAnalyze}>
          <div className="two-col">
            <label>
              Exam name
              <input
                value={form.exam_name}
                onChange={(event) => updateField('exam_name', event.target.value)}
                placeholder="Selective Trial"
              />
            </label>
            <label>
              Exam date
              <input
                type="date"
                value={form.exam_date}
                onChange={(event) => updateField('exam_date', event.target.value)}
              />
            </label>
            <label>
              Provider
              <input
                value={form.provider_name}
                onChange={(event) => updateField('provider_name', event.target.value)}
                placeholder="PreUni / CTedu"
              />
            </label>
            <label>
              Exam type
              <input
                value={form.exam_type}
                onChange={(event) => updateField('exam_type', event.target.value)}
                placeholder="OC / Selective"
              />
            </label>
            <label>
              Duration (minutes)
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(event) => updateField('duration_minutes', event.target.value)}
              />
            </label>
            <label>
              Upload report photo/file
              <input
                type="file"
                accept="image/*,.pdf,.txt,.md,.csv"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                required
              />
            </label>
          </div>

          <h3>Four Subject Scores (required)</h3>
          <div className="two-col">
            <label>
              Chinese
              <input
                type="number"
                step="0.01"
                value={form.score_chinese}
                onChange={(event) => updateField('score_chinese', event.target.value)}
                required
              />
            </label>
            <label>
              English
              <input
                type="number"
                step="0.01"
                value={form.score_english}
                onChange={(event) => updateField('score_english', event.target.value)}
                required
              />
            </label>
            <label>
              Math
              <input
                type="number"
                step="0.01"
                value={form.score_math}
                onChange={(event) => updateField('score_math', event.target.value)}
                required
              />
            </label>
            <label>
              Thinking Skills
              <input
                type="number"
                step="0.01"
                value={form.score_thinking}
                onChange={(event) => updateField('score_thinking', event.target.value)}
                required
              />
            </label>
          </div>

          <h3>Ranking (optional)</h3>
          <div className="two-col">
            <label>
              Rank position
              <input
                type="number"
                min="1"
                value={form.rank_position}
                onChange={(event) => updateField('rank_position', event.target.value)}
                placeholder="120"
              />
            </label>
            <label>
              Rank total
              <input
                type="number"
                min="1"
                value={form.rank_total}
                onChange={(event) => updateField('rank_total', event.target.value)}
                placeholder="1300"
              />
            </label>
            <label>
              Percentile (optional)
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.percentile}
                onChange={(event) => updateField('percentile', event.target.value)}
                placeholder="90.5"
              />
            </label>
          </div>

          <div className="btn-row">
            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'Analyzing...' : 'Upload and Analyze'}
            </button>
          </div>
        </form>
      </div>

      {result ? (
        <div className="card form-grid">
          <h2 className="card-title">AI Analysis Result</h2>
          <p>
            Report ID: <span className="mono">{result.report_id}</span> | Analysis ID:{' '}
            <span className="mono">{result.analysis_id}</span>
          </p>
          <p>
            Extraction:{' '}
            <span className={`status-pill ${(result.extraction?.status || 'SKIPPED').toLowerCase()}`}>
              {result.extraction?.status || 'SKIPPED'}
            </span>{' '}
            via <span className="mono">{result.extraction?.method || '-'}</span>
          </p>
          {result.extraction?.preview ? (
            <label>
              Extracted text preview
              <textarea value={result.extraction.preview} readOnly rows={8} />
            </label>
          ) : null}

          <div className="metric-grid">
            <div className="metric-card">
              <p className="kicker">Chinese</p>
              <h3>{result.subject_scores?.chinese ?? '-'}</h3>
            </div>
            <div className="metric-card">
              <p className="kicker">English</p>
              <h3>{result.subject_scores?.english ?? '-'}</h3>
            </div>
            <div className="metric-card">
              <p className="kicker">Math</p>
              <h3>{result.subject_scores?.math ?? '-'}</h3>
            </div>
            <div className="metric-card">
              <p className="kicker">Thinking</p>
              <h3>{result.subject_scores?.thinking ?? '-'}</h3>
            </div>
          </div>

          {result.ranking?.rank_position && result.ranking?.rank_total ? (
            <p>
              Ranking: {result.ranking.rank_position} / {result.ranking.rank_total}
              {result.ranking.percentile !== null && result.ranking.percentile !== undefined
                ? ` (${Number(result.ranking.percentile).toFixed(2)} percentile)`
                : ''}
            </p>
          ) : null}

          <p>
            AI status:{' '}
            <span className={`status-pill ${(result.analysis?.ai_status || 'SKIPPED').toLowerCase()}`}>
              {result.analysis?.ai_status || 'SKIPPED'}
            </span>
          </p>

          {aiSummary ? (
            <div className="form-grid">
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
          ) : (
            <p>No AI summary returned for this run.</p>
          )}

          <div className="btn-row">
            <Link className="secondary-btn" href={`/students/${studentId}/diagnosis`}>
              Open Diagnosis
            </Link>
            <Link className="secondary-btn" href={`/students/${studentId}/reports`}>
              Open Reports
            </Link>
            <Link className="secondary-btn" href={`/students/${studentId}/prescriptions`}>
              Open Prescriptions
            </Link>
            <Link className="secondary-btn" href={`/students/${studentId}/progress`}>
              Open Progress
            </Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
