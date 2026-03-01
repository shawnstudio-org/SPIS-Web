'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import UploadZone from '@/components/UploadZone';

export default function NewReportPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id;

    const [file, setFile] = useState(null);
    const [subject, setSubject] = useState('Mathematical Reasoning');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('report_file', file);
        formData.append('subject', subject);

        try {
            await api.post(`/students/${studentId}/reports`, formData, { isForm: true });
            router.push(`/students/${studentId}/reports`);
        } catch (err) {
            setError(err.message || 'Failed to upload report.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <PageHeader
                title="Upload New Report"
                subtitle="Upload a PDF or image of a mock test report. The AI will extract scores and error types."
            />

            <div className="card" style={{ marginTop: '24px' }}>
                <div className="form-grid">
                    <div>
                        <label>Subject</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        >
                            <option value="Mathematical Reasoning">Mathematical Reasoning</option>
                            <option value="Thinking Skills">Thinking Skills</option>
                            <option value="Reading">Reading</option>
                        </select>
                    </div>

                    <div>
                        <label>Report File</label>
                        <UploadZone
                            onFileSelect={setFile}
                            accept=".pdf,image/*"
                            maxSize={8 * 1024 * 1024}
                        />
                    </div>

                    {error && <div className="error-box">{error}</div>}

                    <div className="btn-row" style={{ marginTop: '16px' }}>
                        <button
                            className="primary-btn"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            style={{ width: '100%' }}
                        >
                            {uploading ? 'Analyzing Report...' : 'Upload & Analyze'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
