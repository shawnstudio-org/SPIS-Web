'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import UploadZone from '@/components/UploadZone';

const SUBJECTS = [
    { value: 'Mathematical Reasoning', label: 'Mathematical Reasoning', icon: '🔢' },
    { value: 'Thinking Skills', label: 'Thinking Skills', icon: '🧠' },
    { value: 'Reading', label: 'Reading', icon: '📖' },
    { value: 'Writing', label: 'Writing', icon: '✍️' },
];

export default function NewReportPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id;

    const [file, setFile] = useState(null);
    const [subject, setSubject] = useState('Mathematical Reasoning');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState('');

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        setProgress('Uploading file…');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('exam_name', `${subject} Mock Test`);

        try {
            setProgress('Extracting text from report…');
            await api.post(
                `/students/${studentId}/reports/quick-analyze`,
                formData,
                { isForm: true, timeoutMs: 120000 }
            );
            setProgress('Done! Redirecting…');
            router.push(`/students/${studentId}/reports`);
        } catch (err) {
            setError(err.message || 'Failed to upload report. Please try again.');
            setProgress('');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <PageHeader
                title="Upload New Report"
                subtitle="Upload a PDF or image — the AI will extract scores and analyse error patterns."
                breadcrumbs={[
                    { label: 'Reports', href: `/students/${studentId}/reports` },
                    { label: 'New Upload' },
                ]}
            />

            <div className="card" style={{ marginTop: '24px' }}>
                {/* Subject selector */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '12px' }}>
                        Subject
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {SUBJECTS.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => setSubject(s.value)}
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: subject === s.value ? '2px solid var(--accent)' : '1px solid var(--line)',
                                    background: subject === s.value ? 'var(--accent-soft)' : 'var(--bg-surface)',
                                    color: subject === s.value ? 'var(--accent)' : 'var(--ink)',
                                    fontWeight: subject === s.value ? 700 : 500,
                                    fontSize: 'var(--text-sm)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>{s.icon}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upload zone */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '12px' }}>
                        Report File
                    </div>
                    <UploadZone
                        onFileSelect={setFile}
                        accept=".pdf,image/*"
                        maxSize={8 * 1024 * 1024}
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="error-box" style={{ marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                {/* Progress indicator */}
                {uploading && progress && (
                    <div className="info-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: 16, height: 16, border: '2px solid rgba(30,64,175,0.3)', borderTopColor: '#1e40af', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                        {progress}
                    </div>
                )}

                {/* Submit */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="secondary-btn"
                        onClick={() => router.push(`/students/${studentId}/reports`)}
                        disabled={uploading}
                        style={{ flexShrink: 0 }}
                    >
                        Cancel
                    </button>
                    <button
                        className="primary-btn"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        style={{ flex: 1 }}
                    >
                        {uploading ? (
                            <>
                                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Analyzing Report…
                            </>
                        ) : (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                                Upload &amp; Analyze
                            </>
                        )}
                    </button>
                </div>

                {!file && (
                    <p style={{ textAlign: 'center', marginTop: '12px', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                        Select a file above to enable upload
                    </p>
                )}
            </div>

            {/* Info note */}
            <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--line-subtle)', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                AI extraction can take up to 60 seconds. Do not close this page while it's processing.
            </div>
        </div>
    );
}
