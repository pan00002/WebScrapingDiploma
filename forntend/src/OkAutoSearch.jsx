import React, { useState } from 'react';
import { okSearchByKeyword, getTaskStatus } from './api';

export default function OkAutoSearch() {
    const [keywords, setKeywords] = useState('');
    const [maxGroups, setMaxGroups] = useState(10);
   
    const [loading, setLoading] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState({ total: 0, processed: 0, found: 0 });

    const startPolling = (id) => {
        const interval = setInterval(async () => {
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
        }, 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!keywords.trim()) return alert('Введите ключевые слова');
        setLoading(true);
        try {
            const task = await okSearchByKeyword(keywords, maxGroups);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска');
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '2rem' }}>
            <h2>Автоматический поиск по группам Одноклассников</h2>
            <form onSubmit={handleSubmit}>
                <textarea rows="2" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Ключевые слова (через запятую)" style={{ width: '100%' }} />
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <label>Макс. групп: <input type="number" value={maxGroups} onChange={e => setMaxGroups(Number(e.target.value))} min="1" max="50" style={{ width: '70px' }} /></label>
                   
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '10px' }}>{loading ? 'Поиск...' : 'Искать'}</button>
            </form>
            {taskId && <p>ID задачи: {taskId} | Прогресс: {progress.processed} / {progress.total} групп, найдено: {progress.found}</p>}
            {results.map((res, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #ddd', marginBottom: '10px', paddingBottom: '10px' }}>
                    <img src="https://ok.ru/static/img/logo.png" alt="OK" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                    <div><a href={res.url} target="_blank">{res.page_title}</a><p><strong>{res.keyword}</strong>: {res.context}</p></div>
                </div>
            ))}
        </div>
    );
}