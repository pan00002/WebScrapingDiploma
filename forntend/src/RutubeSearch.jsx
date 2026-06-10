import React, { useState } from 'react';
import { rutubeSearch, getTaskStatus } from './api';

export default function RutubeSearch() {
    const [keywords, setKeywords] = useState('');
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
        if (!keywords.trim()) {
            alert('Введите ключевые слова');
            return;
        }
        setLoading(true);
        setResults([]);
        try {
            const task = await rutubeSearch(keywords);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
    console.error('Ошибка при запуске поиска RuTube:', err);
    let errorMsg = 'Неизвестная ошибка';
    if (err.response) {
        // Сервер ответил с ошибкой (4xx, 5xx)
        errorMsg = `Ошибка сервера: ${err.response.status} - ${err.response.data?.detail || err.message}`;
    } else if (err.request) {
        // Запрос был отправлен, но ответа нет (бэкенд не запущен или недоступен)
        errorMsg = 'Бэкенд не отвечает. Проверьте, запущен ли сервер (python run.py)';
    } else {
        errorMsg = err.message || 'Ошибка при отправке запроса';
    }
    alert(errorMsg);
    setLoading(false);
}
    };

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '2rem' }}>
            <h2>Поиск видео на RuTube</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Ключевые слова (через запятую)</label>
                    <textarea rows="2" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%' }} />
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Поиск...' : 'Искать на RuTube'}
                </button>
            </form>
            {taskId && (
                <div>
                    <p>Задача: {taskId}</p>
                    <p>Прогресс: найдено {progress.found} видео</p>
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