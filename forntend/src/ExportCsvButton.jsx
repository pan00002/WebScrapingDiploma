import React from 'react';

export default function ExportCsvButton({ taskId, disabled }) {
    const handleExport = () => {
        if (!taskId) return;
        window.open(`http://localhost:8000/api/export/csv/${taskId}`, '_blank');
    };

    return (
        <button
            onClick={handleExport}
            disabled={disabled || !taskId}
            style={{
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                border: 'none',
                borderRadius: '40px',
                padding: '8px 20px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85rem',
                marginLeft: '12px'
            }}
        >
            📥 Скачать CSV
        </button>
    );
}