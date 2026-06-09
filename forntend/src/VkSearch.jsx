import React, { useState } from 'react';
import { vkSearch, getTaskStatus } from './api';

export default function VkSearch() {
    const [keywords, setKeywords] = useState('');
    const [groups, setGroups] = useState('');
    const [loading, setLoading] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [results, setResults] = useState([]);
    const [progress, setProgress] = useState({ total: 0, processed: 0, found: 0 });

    const startPolling = (taskId) => {
        const interval = setInterval(async () => {
            const data = await getTaskStatus(taskId);
            if (data.status === 'completed') {
                console.log('Получены результаты:', data.results);  // <-- смотрим в консоль браузера
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
        if (!keywords.trim() || !groups.trim()) {
            alert('Введите ключевые слова и названия сообществ');
            return;
        }
        setLoading(true);
        setResults([]);
        try {
            const task = await vkSearch(keywords, groups);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска VK');
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '2rem' }}>
            <h2>Поиск по сообществам ВКонтакте</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Ключевые слова (через запятую)</label>
                    <textarea rows="2" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                    <label>Названия сообществ (по одному на строку)</label>
                    <textarea rows="4" value={groups} onChange={e => setGroups(e.target.value)} placeholder="izvmor&#10;durov&#10;club123" style={{ width: '100%' }} />
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Поиск...' : 'Искать в VK'}
                </button>
            </form>
            {taskId && (
                <div>
                    <p>Задача: {taskId}</p>
                    <p>Прогресс: {progress.processed} / {progress.total} сообществ, найдено: {progress.found}</p>
                </div>
            )}
            {results.length > 0 && (
                <div>
                    <h3>Результаты ({results.length})</h3>
                    {results.map((res, idx) => (
                        <div key={idx} style={{ border: '1px solid #ddd', margin: '1rem 0', padding: '1rem', borderRadius: '8px' }}>
                            <a href={res.url} target="_blank" rel="noreferrer"><strong>{res.page_title}</strong></a>
                            <p>Ключевое слово: {res.keyword}</p>
                            <p>{res.context}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}