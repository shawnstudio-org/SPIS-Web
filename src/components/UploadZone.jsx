'use client';

import { useRef, useState } from 'react';

export default function UploadZone({ onFileSelect, accept = '.pdf,.png,.jpg,.jpeg', maxSize, label }) {
    const inputRef = useRef(null);
    const [dragover, setDragover] = useState(false);
    const [file, setFile] = useState(null);

    const handleFile = (f) => {
        if (!f) return;
        if (maxSize && f.size > maxSize) {
            alert(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
            return;
        }
        setFile(f);
        onFileSelect?.(f);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragover(false);
        handleFile(e.dataTransfer.files?.[0]);
    };

    const onDragOver = (e) => { e.preventDefault(); setDragover(true); };
    const onDragLeave = () => setDragover(false);

    return (
        <div
            className={`upload-zone ${dragover ? 'dragover' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={(e) => handleFile(e.target.files?.[0])}
                style={{ display: 'none' }}
            />
            <div className="upload-zone-icon">📎</div>
            {file ? (
                <div className="upload-zone-text">
                    <strong>{file.name}</strong> ({(file.size / 1024).toFixed(0)} KB)
                </div>
            ) : (
                <>
                    <div className="upload-zone-text">
                        <strong>Click to upload</strong> or drag and drop
                    </div>
                    <div className="upload-zone-hint">
                        {label || 'PDF, PNG, or JPG (max 8MB)'}
                    </div>
                </>
            )}
        </div>
    );
}
