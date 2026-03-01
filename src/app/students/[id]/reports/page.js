'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function StudentReportsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id;
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        api.get(`/students/${studentId}/reports`)
            .then((res) => setReports(res?.reports || []))
            .catch(() => setReports([]))
            .finally(() => setLoading(false));
    }, [studentId]);

    const handleUploadClick = () => {
        router.push(`/students/${studentId}/reports/new`);
    };

    if (loading) return <div className="loading-wrap"><div className="loader"></div></div>;

    const hasReports = reports.length > 0;

    return (
        <div>
            <div className="page-header-row" style={{ marginBottom: '24px' }}>
                <PageHeader
                    title="Mock Test Reports"
                    subtitle="View and manage all uploaded test reports for this student."
                />
                <button className="primary-btn" onClick={handleUploadClick}>
                    Upload New Report
                </button>
            </div>

            {!hasReports ? (
                <EmptyState
                    title="No reports uploaded"
                    description="Upload a past test report to generate an AI diagnosis and start practicing."
                    actionText="Upload Report"
                    onAction={handleUploadClick}
                />
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Raw Score</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r, i) => (
                                <tr key={r.id || i}>
                                    <td>{r.test_date || r.created_at?.split('T')[0] || 'Unknown Date'}</td>
                                    <td>
                                        <span className="mono">{r.subject || 'Mixed'}</span>
                                    </td>
                                    <td>{r.total_score || '-'} / {r.possible_score || '-'}</td>
                                    <td>
                                        <span className={`status-pill ${r.status?.toLowerCase() === 'processed' ? 'done' : 'pending'}`}>
                                            {r.status || 'PROCESSED'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="ghost-btn" onClick={() => router.push(`/students/${studentId}/diagnosis`)}>
                                            View Diagnosis
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
