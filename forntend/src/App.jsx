import React, { useState } from 'react';
import { startSearch, getTaskStatus } from './api';
import VkSearch from './VkSearch';

function App() {
    const [keywords, setKeywords] = useState('');
    const [sites, setSites] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState({ total: 0, processed: 0, found: 0 });
    const [taskId, setTaskId] = useState(null);

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
        if (!keywords.trim() || !sites.trim()) {
            alert('Введите ключевые слова и URL сайтов');
            return;
        }
        setLoading(true);
        setResults([]);
        try {
            const task = await startSearch(keywords, sites);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска');
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <h1>Веб-скрепер</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Ключевые слова (через запятую)</label>
                    <textarea rows="2" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                    <label>Сайты (по одному на строку, с http:// или https://)</label>
                    <textarea rows="5" value={sites} onChange={e => setSites(e.target.value)} placeholder="https://example.com" style={{ width: '100%' }} />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Поиск...' : 'Искать на сайтах'}
                </button>
            </form>
            {taskId && (
                <div>
                    <p>Задача: {taskId}</p>
                    <p>Прогресс: {progress.processed} / {progress.total} страниц, найдено: {progress.found}</p>
                </div>
            )}
            {results.length > 0 && (
                <div>
                    <h3>Результаты ({results.length})</h3>
                    {results.map((res, idx) => (
                        <div key={idx} style={{ border: '1px solid #ddd', margin: '1rem 0', padding: '1rem', borderRadius: '8px' }}>
                            <a href={res.url} target="_blank" rel="noreferrer"><strong>{res.page_title || res.url}</strong></a>
                            <p>Ключевое слово: {res.keyword}</p>
                            <p>{res.context}</p>
                        </div>
                    ))}
                </div>
            )}
            <VkSearch />
        </div>
    );
}

export default App;