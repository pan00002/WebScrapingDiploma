import React, { useState } from 'react';
import { vkSearchByKeyword, getTaskStatus } from './api';
import VkAutoStatsChart from './VkAutoStatsChart';
import SentimentStats from './SentimentStats';

export default function VkAutoSearch() {
    const [keywords, setKeywords] = useState('');
    const [maxGroups, setMaxGroups] = useState(10);
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState({ total: 0, processed: 0, found: 0 });
    const [currentTaskId, setCurrentTaskId] = useState(null);
    const [taskStatus, setTaskStatus] = useState(null);

    const startPolling = (id) => {
        const interval = setInterval(async () => {
            try {
                const data = await getTaskStatus(id);
                setProgress(data.progress);
                setTaskStatus(data.status);
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
        setCurrentTaskId(null);
        setTaskStatus(null);
        try {
            const task = await vkSearchByKeyword(keywords, maxGroups, days);
            setTaskId(task.task_id);
            setCurrentTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска VK');
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/21/VK.com-logo.svg" alt="VK" style={{ width: '36px', height: '36px' }} />
                <h3 style={{ margin: 0, fontSize: '1.6rem' }}>VK Автопоиск</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>Ключевые слова (через запятую)</label>
                    <textarea
                        rows="3"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }}
                        placeholder="например: Саранск, котики"
                    />
                </div>
                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Максимум групп</label>
                        <input
                            type="number"
                            value={maxGroups}
                            onChange={e => setMaxGroups(Number(e.target.value))}
                            min="1"
                            max="50"
                            style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>За последние N дней</label>
                        <input
                            type="number"
                            value={days}
                            onChange={e => setDays(Number(e.target.value))}
                            min="1"
                            max="365"
                            style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
                        />
                    </div>
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
                    {loading ? 'Поиск...' : '▶ Найти группы и посты'}
                </button>
            </form>
            {taskId && (
                <div style={{ marginTop: '16px', background: '#f1f5f9', padding: '12px', borderRadius: '16px', fontSize: '0.85rem', overflow: 'auto' }}>
                    <div>Задача: <code>{taskId}</code></div>
                    <div>Прогресс: {progress.processed} / {progress.total} групп, найдено: {progress.found}</div>
                </div>
            )}
            <VkAutoStatsChart taskId={currentTaskId} status={taskStatus} />
            <SentimentStats taskId={currentTaskId} />
            {results.length > 0 && (
                <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '24px' }}>
                    <h4 style={{ marginBottom: '12px' }}>📋 Найденные посты ({results.length})</h4>
                    {results.map((res, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
                            <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>{res.page_title}</a>
                            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>{res.context}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{res.published_at}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}