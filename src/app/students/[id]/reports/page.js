'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

function StatusPill({ status }) {
    const map = {
        DONE: { label: 'Analyzed', cls: 'done' },
        PENDING: { label: 'Pending', cls: 'pending' },
        FAILED: { label: 'Failed', cls: 'failed' },
        COMPLETED: { label: 'Uploaded', cls: 'in_progress' },
    };
    const { label, cls } = map[status] || { label: status || 'Unknown', cls: 'pending' };
    return <span className={`status-pill ${cls}`}>{label}</span>;
}

function ReportCard({ report, studentId, onAnalyze, analyzing }) {
    const router = useRouter();
    const date = report.exam_date || report.created_at?.split('T')[0] || '—';
    const isDone = report.analysis_status === 'DONE';
    const isAnalyzing = analyzing === report.id;

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top row: date + status */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                    <div className="kicker">{date}</div>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginTop: '2px', color: 'var(--ink)' }}>
                        {report.exam_name || 'Untitled Report'}
                    </div>
                    {report.provider_name && (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginTop: '2px' }}>
                            {report.provider_name}
                        </div>
                    )}
                </div>
                <StatusPill status={report.analysis_status || report.entry_status} />
            </div>

            {/* Score row */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Total Score</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                        {report.score_total ?? '—'}
                    </div>
                </div>
                {report.percentile != null && (
                    <div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Percentile</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                            {report.percentile}%
                        </div>
                    </div>
                )}
                {report.rank_position && report.rank_total && (
                    <div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Rank</div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                            {report.rank_position}/{report.rank_total}
                        </div>
                    </div>
                )}
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                {isDone ? (
                    <button
                        className="primary-btn"
                        onClick={() => router.push(`/students/${studentId}/diagnosis`)}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        View Diagnosis
                    </button>
                ) : (
                    <button
                        className="primary-btn"
                        onClick={() => onAnalyze(report.id)}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Analyzing…
                            </>
                        ) : (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                                Run Analysis
                            </>
                        )}
                    </button>
                )}
                <button
                    className="secondary-btn"
                    onClick={() => router.push(`/students/${studentId}/reports/${report.id}`)}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Details
                </button>
            </div>
        </div>
    );
}

export default function StudentReportsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id;

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(null); // report id being analyzed
    const [analyzeError, setAnalyzeError] = useState(null);

    const fetchReports = useCallback(() => {
        if (!studentId) return;
        api.get(`/students/${studentId}/reports`)
            .then((res) => setReports(Array.isArray(res) ? res : []))
            .catch(() => setReports([]))
            .finally(() => setLoading(false));
    }, [studentId]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleAnalyze = async (reportId) => {
        setAnalyzing(reportId);
        setAnalyzeError(null);
        try {
            await api.post(`/reports/${reportId}/analyze`, {});
            await fetchReports();
        } catch (err) {
            setAnalyzeError(err.message || 'Analysis failed. Please try again.');
        } finally {
            setAnalyzing(null);
        }
    };

    if (loading) return <div className="loading-wrap"><div className="loader" /></div>;

    const done = reports.filter(r => r.analysis_status === 'DONE');
    const pending = reports.filter(r => r.analysis_status !== 'DONE');

    return (
        <div>
            <PageHeader
                title="Mock Test Reports"
                subtitle={`${reports.length} report${reports.length !== 1 ? 's' : ''} uploaded`}
                actions={
                    <button className="primary-btn" onClick={() => router.push(`/students/${studentId}/reports/new`)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Upload Report
                    </button>
                }
            />

            {analyzeError && (
                <div className="error-box" style={{ marginBottom: '20px' }}>
                    {analyzeError}
                </div>
            )}

            {reports.length === 0 ? (
                <EmptyState
                    title="No reports yet"
                    description="Upload a mock test report to get an AI-powered diagnosis and error breakdown."
                    action={
                        <button className="primary-btn" onClick={() => router.push(`/students/${studentId}/reports/new`)}>
                            Upload First Report
                        </button>
                    }
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {pending.length > 0 && (
                        <section>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '14px' }}>
                                Needs Analysis — {pending.length}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                {pending.map(r => (
                                    <ReportCard
                                        key={r.id}
                                        report={r}
                                        studentId={studentId}
                                        onAnalyze={handleAnalyze}
                                        analyzing={analyzing}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {done.length > 0 && (
                        <section>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '14px' }}>
                                Analyzed — {done.length}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                {done.map(r => (
                                    <ReportCard
                                        key={r.id}
                                        report={r}
                                        studentId={studentId}
                                        onAnalyze={handleAnalyze}
                                        analyzing={analyzing}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
