import React, { useState } from 'react';
import { okPresetSearch, getTaskStatus } from './api';

export default function OkPresetSearch() {
    const [keywords, setKeywords] = useState('');
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState({ total: 0, processed: 0, found: 0 });

    const startPolling = (id) => {
        const interval = setInterval(async () => {
            try {
                const data = await getTaskStatus(id);
                setProgress(data.progress);
                if (data.status === 'completed') {
                    setResults(data.results || []);
                    setLoading(false);
                    clearInterval(interval);
                } else if (data.status === 'failed') {
                    alert('Ошибка: ' + data.error);
                    setLoading(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
                clearInterval(interval);
            }
        }, 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!keywords.trim()) return alert('Введите ключевые слова');
        setLoading(true);
        setResults([]);
        try {
            const task = await okPresetSearch(keywords, days);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска OK');
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <img src="https://avatars.mds.yandex.net/i?id=45c71577aa2da46fd2e617ecad7540c2800134ed-9224110-images-thumbs&n=13" alt="OK" style={{ width: '36px', height: '36px' }} />
                <h3 style={{ margin: 0, fontSize: '1.6rem' }}>Поиск по ОК </h3>
            </div>
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Ключевые слова (через запятую)</label>
                    <textarea
                        rows="3"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }}
                        placeholder="например: работа, Саранск"
                    />
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>За последние N дней</label>
                    <input
                        type="number"
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                        min="1"
                        max="365"
                        style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '14px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    {loading ? 'Поиск...' : '▶ Искать в группах OK'}
                </button>
            </form>
            {taskId && (
                <div style={{ marginTop: '16px', background: '#f1f5f9', padding: '12px', borderRadius: '16px', overflow: 'auto' }}>
                    <div>Задача: <code>{taskId}</code></div>
                    <div>Найдено совпадений: {progress.found}</div>
                </div>
            )}
            {results.length > 0 && (
                <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '24px' }}>
                    <h4>📋 Результаты ({results.length})</h4>
                    {results.map((res, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
                            <a href={res.url} target="_blank" rel="noopener noreferrer"><strong>{res.page_title}</strong></a>
                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>{res.context}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{res.published_at}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}