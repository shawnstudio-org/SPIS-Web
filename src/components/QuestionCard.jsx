'use client';

import { useState } from 'react';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuestionCard({ question, index, onAnswer, showResult, disabled }) {
    const [selected, setSelected] = useState(null);
    const options = typeof question.options_json === 'string'
        ? JSON.parse(question.options_json || '[]')
        : Array.isArray(question.options_json) ? question.options_json : [];

    const handleSelect = (option) => {
        if (disabled || showResult) return;
        setSelected(option);
        onAnswer?.(option);
    };

    const getOptionClass = (option) => {
        if (!showResult) return option === selected ? 'selected' : '';
        if (option === question.correct_answer) return 'correct';
        if (option === selected && option !== question.correct_answer) return 'wrong';
        return '';
    };

    const cardClass = showResult
        ? selected === question.correct_answer ? 'answered-correct' : 'answered-wrong'
        : '';

    return (
        <div className={`card practice-card ${cardClass}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="practice-card-number">{(index ?? 0) + 1}</span>
                <span className="status-pill low" style={{ fontSize: '0.7rem' }}>
                    {question.subject} · {question.module}
                </span>
            </div>

            <div className="practice-question-text">{question.question_text}</div>

            {options.length > 0 && (
                <div className="practice-options">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            className={`practice-option ${getOptionClass(opt)}`}
                            onClick={() => handleSelect(opt)}
                            disabled={disabled || showResult}
                            type="button"
                        >
                            <span className="practice-option-label">{LABELS[i] || i + 1}</span>
                            <span>{opt}</span>
                        </button>
                    ))}
                </div>
            )}

            {showResult && question.explanation && (
                <div className="info-box top-gap-sm">
                    <strong>Explanation:</strong> {question.explanation}
                </div>
            )}
        </div>
    );
}
