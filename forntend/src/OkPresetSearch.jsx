// frontend/src/OkPresetSearch.js
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
        if (!keywords.trim()) {
            alert('Введите ключевые слова');
            return;
        }
        setLoading(true);
        setResults([]);
        try {
            const task = await okPresetSearch(keywords, days);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска');
            setLoading(false);
        }
    };

    const OK_LOGO = "https://ok.ru/static/img/logo.png";

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '2rem' }}>
            <h2>Поиск по предустановленным группам Одноклассников</h2>
            <p>Поиск выполняется в фиксированном списке из 50+ групп (Саранск, Мордовия, птицы, котики, новости).</p>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Ключевые слова (через запятую)</label>
                    <textarea rows="2" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%' }} placeholder="например: Саранск, котики" />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label>За последние N дней: </label>
                    <input type="number" value={days} onChange={e => setDays(Number(e.target.value))} min="1" max="365" style={{ width: '80px' }} />
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Поиск...' : 'Искать в предустановленных группах'}
                </button>
            </form>

            {taskId && (
                <div style={{ marginTop: '1rem' }}>
                    <p>ID задачи: <code>{taskId}</code></p>
                    <p>Прогресс: обработано {progress.processed} из {progress.total} групп, найдено совпадений: {progress.found}</p>
                </div>
            )}

            {results.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Результаты ({results.length})</h3>
                    {results.map((res, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #ddd', marginBottom: '15px', paddingBottom: '15px' }}>
                            <img src={OK_LOGO} alt="OK" style={{ width: '40px', height: '40px' }} />
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