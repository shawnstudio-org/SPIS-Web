'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import QuestionCard from '@/components/QuestionCard';
import EmptyState from '@/components/EmptyState';

export default function DailyPracticePage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id;

    const [practiceSet, setPracticeSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (!studentId) return;
        fetchPracticeSet();
    }, [studentId]);

    const fetchPracticeSet = async () => {
        setLoading(true);
        setError(null);
        try {
            // Attempt to fetch today's set, or generate a new one if not exists
            let res = await api.get(`/students/${studentId}/daily-practice`);
            if (!res || !res.items || res.items.length === 0) {
                res = await api.post(`/students/${studentId}/daily-practice`);
            }
            setPracticeSet(res);

            // If already completed, show results immediately
            if (res?.status === 'COMPLETED') {
                setShowResults(true);
                const restoredAnswers = {};
                res.items.forEach(item => {
                    if (item.student_answer) restoredAnswers[item.id] = item.student_answer;
                });
                setAnswers(restoredAnswers);
            }
        } catch (err) {
            setError(err.message || 'Failed to load practice set');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (itemId, option) => {
        setAnswers(prev => ({ ...prev, [itemId]: option }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.post(`/students/${studentId}/daily-practice/submit`, {
                practice_set_id: practiceSet.id,
                answers
            });
            setShowResults(true);
            // Re-fetch to get correct answers and explanations
            await fetchPracticeSet();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            alert('Failed to submit: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-wrap"><div className="loader"></div></div>;
    if (error) return <div className="error-box">{error}</div>;

    if (!practiceSet || !practiceSet.items || practiceSet.items.length === 0) {
        return (
            <div>
                <PageHeader title="Daily Practice" subtitle="Personalized question sets based on your weak areas." />
                <EmptyState
                    title="No questions today"
                    description="Upload more reports to generate personalized daily practice sets."
                />
            </div>
        );
    }

    const { items, score_pct } = practiceSet;
    const allAnswered = items.every(item => answers[item.id]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <PageHeader
                title={showResults ? "Practice Results" : "Daily Practice"}
                subtitle={showResults
                    ? `You scored ${Math.round(score_pct || 0)}%. Review your answers below.`
                    : "Complete today's personalized question set addressing your weak areas."}
            />

            <div className="content-grid" style={{ marginTop: '32px' }}>
                {items.map((item, index) => {
                    // Normalize backend item data for QuestionCard
                    const question = {
                        ...item.question,
                        correct_answer: showResults ? item.question.correct_answer : null,
                        explanation: showResults ? item.question.explanation : null
                    };

                    return (
                        <QuestionCard
                            key={item.id}
                            index={index}
                            question={question}
                            onAnswer={(opt) => handleAnswer(item.id, opt)}
                            showResult={showResults}
                            disabled={showResults || submitting}
                        />
                    );
                })}
            </div>

            {!showResults && (
                <div className="card" style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '16px', color: 'var(--ink-secondary)' }}>
                        {Object.keys(answers).length} of {items.length} answered
                    </p>
                    <button
                        className="primary-btn"
                        onClick={handleSubmit}
                        disabled={!allAnswered || submitting}
                        style={{ padding: '12px 32px', fontSize: 'var(--text-lg)' }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Answers'}
                    </button>
                    {!allAnswered && (
                        <p className="top-gap-xs" style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>
                            Please answer all questions before submitting.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
