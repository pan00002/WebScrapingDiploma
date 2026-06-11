// frontend/src/YoutubeSearch.js
import React, { useState } from 'react';
import { youtubeSearch, getTaskStatus } from './api';

export default function YoutubeSearch() {
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
            const task = await youtubeSearch(keywords);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска YouTube');
            setLoading(false);
        }
    };

    const YOUTUBE_LOGO = "https://img.icons8.com/color/48/youtube-play.png";

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '2rem' }}>
            <h2>Поиск видео на YouTube</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Ключевые слова (через запятую)</label>
                    <textarea rows="2" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%' }} placeholder="например: новости сегодня" />
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Поиск...' : 'Искать на YouTube'}
                </button>
            </form>

            {taskId && (
                <div style={{ marginTop: '1rem' }}>
                    <p>ID задачи: <code>{taskId}</code></p>
                    <p>Прогресс: найдено {progress.found} видео</p>
                </div>
            )}

            {results.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Результаты ({results.length})</h3>
                    {results.map((res, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #ddd', marginBottom: '15px', paddingBottom: '15px' }}>
                            <img src={YOUTUBE_LOGO} alt="YouTube" style={{ width: '40px', height: '40px' }} />
                            <div>
                                <a href={res.url} target="_blank" rel="noopener noreferrer"><strong>{res.page_title}</strong></a>
                                <p><strong>Ключевое слово:</strong> {res.keyword}</p>
                                <p>{res.context}</p>
                                <p><strong>Дата:</strong> {res.published_at || 'не указана'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}