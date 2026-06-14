import React, { useState } from 'react';
import { startSearch, crawlerSearch, getTaskStatus } from './api';

export default function CustomUrlSearch() {
    const [keywords, setKeywords] = useState('');
    const [urls, setUrls] = useState('');
    const [mode, setMode] = useState('simple'); // 'simple' или 'crawler'
    const [maxDepth, setMaxDepth] = useState(2);
    const [maxPages, setMaxPages] = useState(50);
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
        if (!keywords.trim() || !urls.trim()) {
            alert('Введите ключевые слова и хотя бы один URL');
            return;
        }
        setLoading(true);
        setResults([]);
        try {
            let task;
            if (mode === 'simple') {
                task = await startSearch(keywords, urls);
            } else {
                task = await crawlerSearch(keywords, urls, maxDepth, maxPages);
            }
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска');
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#ffffff', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 40px -12px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2rem' }}></span>
                <h2 style={{ margin: 0 }}>Поиск по заданным страницам</h2>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Режим поиска</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="radio" value="simple" checked={mode === 'simple'} onChange={() => setMode('simple')} />
                        Только по указанным URL
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="radio" value="crawler" checked={mode === 'crawler'} onChange={() => setMode('crawler')} />
                        Глубокий обход (краулер)
                    </label>
                </div>
            </div>

            {mode === 'crawler' && (
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Максимальная глубина</label>
                        <input
                            type="number"
                            value={maxDepth}
                            onChange={e => setMaxDepth(Number(e.target.value))}
                            min="0"
                            max="5"
                            style={{ width: '100px', padding: '8px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                        />
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>0 – только стартовые страницы</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Максимум страниц</label>
                        <input
                            type="number"
                            value={maxPages}
                            onChange={e => setMaxPages(Number(e.target.value))}
                            min="1"
                            max="500"
                            step="10"
                            style={{ width: '100px', padding: '8px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Ключевые слова (через запятую)</label>
                    <textarea
                        rows="2"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                        placeholder="например: новости, Москва"
                    />
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Ссылки (каждая с новой строки)</label>
                    <textarea
                        rows="5"
                        value={urls}
                        onChange={e => setUrls(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'monospace' }}
                        placeholder="https://example.com&#10;https://another-site.org/page"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        border: 'none',
                        borderRadius: '60px',
                        padding: '14px 28px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    {loading ? 'Поиск...' : mode === 'crawler' ? ' Запустить глубокий поиск' : ' Начать поиск'}
                </button>
            </form>

            {taskId && (
                <div style={{ marginTop: '20px', background: '#f1f5f9', padding: '14px', borderRadius: '20px' }}>
                    <p>Задача: <code>{taskId}</code></p>
                    <p>Прогресс: {progress.processed} / {progress.total} страниц, найдено совпадений: {progress.found}</p>
                </div>
            )}

            {results.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h3>📋 Результаты ({results.length})</h3>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {results.map((res, idx) => (
                            <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
                                <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                    {res.page_title || res.url}
                                </a>
                                <p><strong>Ключевое слово:</strong> {res.keyword}</p>
                                <p>{res.context}</p>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📅 {res.published_at || 'дата не указана'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}