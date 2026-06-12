// frontend/src/UnifiedSearch.js
import React, { useState, useEffect, useRef } from 'react';
import { unifiedSearch, getTaskStatus, getSentimentStats } from './api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Иконки для источников
const getSourceIcon = (source) => {
    switch (source?.toLowerCase()) {
        case 'vk':
            return 'https://upload.wikimedia.org/wikipedia/commons/2/21/VK.com-logo.svg';
        case 'ok':
            return 'https://typetype.ru/wp-content/uploads/ok_1.jpg';
        case 'rss':
            return 'https://adwebs.ru/upload/iblock/98a/rhus873ierncldvyonl8fgfjokvudw0n/reklama_v_yandekse.png';
        default:
            return null;
    }
};

// Функция подсветки ключевого слова
const highlightKeyword = (text, keyword) => {
    if (!text || !keyword) return text;
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
        regex.test(part) ? (
            <span key={idx} style={{ backgroundColor: 'green', fontWeight: 'bold', padding: '0 2px', borderRadius: '4px' }}>
                {part}
            </span>
        ) : (
            <span key={idx}>{part}</span>
        )
    );
};

export default function UnifiedSearch() {
    const [keywords, setKeywords] = useState('');
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [results, setResults] = useState([]);
    const [sourceStats, setSourceStats] = useState(null);
    const [sentimentStats, setSentimentStats] = useState(null);
    const [taskStatus, setTaskStatus] = useState(null);
    const [page, setPage] = useState(1);
    const postsPerPage = 10;
    const pollingIntervalRef = useRef(null);

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, []);

    const startPolling = (id) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        const interval = setInterval(async () => {
            try {
                const data = await getTaskStatus(id);
                setTaskStatus(data.status);
                if (data.status === 'completed') {
                    setResults(data.results || []);
                    // подсчёт статистики по источникам
                    const sources = {};
                    data.results?.forEach(r => {
                        const src = r.source || 'unknown';
                        sources[src] = (sources[src] || 0) + 1;
                    });
                    setSourceStats(sources);
                    // тональность
                    const sent = await getSentimentStats(id);
                    setSentimentStats(sent.stats);
                    setLoading(false);
                    clearInterval(interval);
                    pollingIntervalRef.current = null;
                } else if (data.status === 'failed') {
                    alert('Ошибка: ' + data.error);
                    setLoading(false);
                    clearInterval(interval);
                    pollingIntervalRef.current = null;
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
                clearInterval(interval);
                pollingIntervalRef.current = null;
            }
        }, 2000);
        pollingIntervalRef.current = interval;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!keywords.trim()) {
            alert('Введите ключевые слова');
            return;
        }
        setLoading(true);
        setResults([]);
        setSourceStats(null);
        setSentimentStats(null);
        setTaskId(null);
        setTaskStatus(null);
        setPage(1);
        try {
            const task = await unifiedSearch(keywords, days);
            setTaskId(task.task_id);
            startPolling(task.task_id);
        } catch (err) {
            console.error(err);
            alert('Ошибка запуска объединённого поиска');
            setLoading(false);
        }
    };

    // пагинация
    const indexOfLast = page * postsPerPage;
    const indexOfFirst = indexOfLast - postsPerPage;
    const currentPosts = results.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(results.length / postsPerPage);
    const nextPage = () => setPage(p => Math.min(p + 1, totalPages));
    const prevPage = () => setPage(p => Math.max(p - 1, 1));

    const sourceChartData = sourceStats ? {
        labels: Object.keys(sourceStats).map(s => {
            if (s === 'vk') return 'ВКонтакте';
            if (s === 'ok') return 'Одноклассники';
            if (s === 'rss') return 'RSS (Яндекс)';
            return s;
        }),
        datasets: [{ data: Object.values(sourceStats), backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'] }]
    } : null;

    const sentimentChartData = sentimentStats ? {
        labels: ['Позитивные', 'Негативные', 'Нейтральные'],
        datasets: [{ data: [sentimentStats.positive, sentimentStats.negative, sentimentStats.neutral], backgroundColor: ['#4CAF50', '#F44336', '#FFC107'] }]
    } : null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h2>🔍 Объединённый поиск (ВК + Одноклассники + RSS)</h2>
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                <div>
                    <label>Ключевые слова (через запятую)</label>
                    <textarea
                        rows="2"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                        placeholder="например: Саранск, котики, новости"
                    />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label>За последние N дней: </label>
                    <input
                        type="number"
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                        min="1"
                        max="365"
                        style={{ width: '80px', marginLeft: '10px' }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
                    {loading ? 'Поиск...' : '🚀 Найти'}
                </button>
            </form>

            {taskId && (
                <div style={{ marginBottom: '15px' }}>
                    <p>ID задачи: <code>{taskId}</code> – статус: {taskStatus}</p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', marginBottom: '30px' }}>
                {sourceChartData && (
                    <div style={{ width: '300px', textAlign: 'center' }}>
                        <h4>Распределение по источникам</h4>
                        <Pie data={sourceChartData} />
                    </div>
                )}
                {sentimentChartData && (
                    <div style={{ width: '300px', textAlign: 'center' }}>
                        <h4>Общая тональность</h4>
                        <Pie data={sentimentChartData} />
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="results-container" style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '20px' }}>
                    <h3>Результаты ({results.length})</h3>
                    {currentPosts.map((res, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #ddd', padding: '15px 0' }}>
                            {getSourceIcon(res.source) && (
                                <img src={getSourceIcon(res.source)} alt={res.source} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                            )}
                            <div style={{ flex: 1 }}>
                                <strong>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer">{res.page_title || 'Без заголовка'}</a>
                                </strong>
                                <span style={{ fontSize: '0.8em', background: '#f0f0f0', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px' }}>
                                    {res.source || 'unknown'}
                                </span>
                                <p><strong>Ключевое слово:</strong> {res.keyword}</p>
                                <p>{highlightKeyword(res.context, res.keyword)}</p>
                                <div style={{ fontSize: '0.85em', color: 'white' }}>
                                    <img 
                                            src="https://img.icons8.com/?size=100&id=43978&format=png&color=000000" 
                                            alt="date" 
                                            style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} 
                                        />
                                    <span>{res.published_at || 'дата не указана'}</span> |
                                    {res.sentiment === 'positive' && ' 😊 Позитивный'}
                                    {res.sentiment === 'negative' && ' 😠 Негативный'}
                                    {res.sentiment === 'neutral' && ' 😐 Нейтральный'}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', margin: '20px 0' }}>
                        <button onClick={prevPage} disabled={page === 1}>◀ Назад</button>
                        <span>Страница {page} из {totalPages}</span>
                        <button onClick={nextPage} disabled={page === totalPages}>Вперёд ▶</button>
                    </div>
                </div>
            )}
        </div>
    );
}