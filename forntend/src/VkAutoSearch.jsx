// frontend/src/VkAutoSearch.js
import React, { useState } from 'react';
import { vkSearchByKeyword, getTaskStatus } from './api';

export default function VkAutoSearch() {
    const [keywords, setKeywords] = useState('');
    const [maxGroups, setMaxGroups] = useState(10);
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
            const task = await vkSearchByKeyword(keywords, maxGroups);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска поиска VK');
            setLoading(false);
        }
    };

    // Логотип VK – всегда отображается (заглушка)
    const VK_LOGO = "https://img.freepik.com/premium-vector/social-media-logo_1305298-30571.jpg?semt=ais_hybrid&w=740&q=80";

    return (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '2rem' }}>
            <h2>Автоматический поиск по сообществам ВКонтакте</h2>
            <p>По ключевому слову будут автоматически найдены группы, затем в них выполнен поиск по вашим ключевым словам.</p>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Ключевые слова для поиска в постах (через запятую)</label>
                    <textarea
                        rows="2"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        style={{ width: '100%' }}
                        placeholder="например: Саранск, Мордовия"
                    />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label>Максимальное количество групп для обработки</label>
                    <input
                        type="number"
                        value={maxGroups}
                        onChange={e => setMaxGroups(Number(e.target.value))}
                        min="1"
                        max="50"
                        style={{ width: '80px', marginLeft: '10px' }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Поиск...' : 'Найти группы и посты'}
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
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                borderBottom: '1px solid #ddd',
                                marginBottom: '15px',
                                paddingBottom: '15px'
                            }}
                        >
                            {/* Логотип VK – всегда отображается, кликабельный */}
                            <a href={res.url} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={VK_LOGO}
                                    alt="VK logo"
                                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            </a>
                            <div style={{ flex: 1 }}>
                                <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>
                                    {res.page_title || res.url}
                                </a>
                                <p><strong>Ключевое слово:</strong> {res.keyword}</p>
                                <p>{res.context}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}