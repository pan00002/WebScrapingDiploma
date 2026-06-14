import React, { useState, useEffect, useRef } from 'react';
import { unifiedSearch, getTaskStatus, getSentimentStats } from './api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ExportCsvButton from './ExportCsvButton';
ChartJS.register(ArcElement, Tooltip, Legend);

const getSourceIcon = (source) => {
    switch (source?.toLowerCase()) {
        case 'vk': return 'https://upload.wikimedia.org/wikipedia/commons/2/21/VK.com-logo.svg';
        case 'ok': return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Logo_Odnoklassniki_2023.svg/1280px-Logo_Odnoklassniki_2023.svg.png';
        case 'rss': return 'https://adwebs.ru/upload/iblock/98a/rhus873ierncldvyonl8fgfjokvudw0n/reklama_v_yandekse.png';
        default: return null;
    }
};

const highlightKeyword = (text, keyword) => {
    if (!text || !keyword) return text;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
        regex.test(part) ? <span key={i} style={{ backgroundColor: '#d4edda', fontWeight: 'bold', padding: '0 2px', borderRadius: '4px' }}>{part}</span> : <span key={i}>{part}</span>
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
    const pollingRef = useRef(null);

    useEffect(() => () => pollingRef.current && clearInterval(pollingRef.current), []);

    const startPolling = (id) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        const interval = setInterval(async () => {
            try {
                const data = await getTaskStatus(id);
                setTaskStatus(data.status);
                if (data.status === 'completed') {
                    setResults(data.results || []);
                    const sources = {};
                    data.results?.forEach(r => { const s = r.source || 'unknown'; sources[s] = (sources[s] || 0) + 1; });
                    setSourceStats(sources);
                    const sent = await getSentimentStats(id);
                    setSentimentStats(sent.stats);
                    setLoading(false);
                    clearInterval(interval);
                    pollingRef.current = null;
                } else if (data.status === 'failed') {
                    alert('Ошибка: ' + data.error);
                    setLoading(false);
                    clearInterval(interval);
                    pollingRef.current = null;
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
                clearInterval(interval);
                pollingRef.current = null;
            }
        }, 2000);
        pollingRef.current = interval;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!keywords.trim()) return alert('Введите ключевые слова');
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

    const indexOfLast = page * postsPerPage;
    const indexOfFirst = indexOfLast - postsPerPage;
    const currentPosts = results.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(results.length / postsPerPage);

    const sourceChartData = sourceStats ? {
        labels: Object.keys(sourceStats).map(s => s === 'vk' ? 'ВКонтакте' : s === 'ok' ? 'Одноклассники' : s === 'rss' ? 'RSS' : s),
        datasets: [{ data: Object.values(sourceStats), backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'] }]
    } : null;
    const sentimentChartData = sentimentStats ? {
        labels: ['Позитивные', 'Негативные', 'Нейтральные'],
        datasets: [{ data: [sentimentStats.positive, sentimentStats.negative, sentimentStats.neutral], backgroundColor: ['#4CAF50', '#F44336', '#FFC107'] }]
    } : null;

    return (
        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 35px -10px rgba(0,0,0,0.1)', color: '#1e293b' }}>
            <h2 style={{ marginTop: 0 }}>Объединённый поиск (Вконтакте  Oдноклассники  Яндекс)</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ключевые слова (через запятую)</label>
                    <textarea rows="2" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid #cbd5e1' }} placeholder="например: Саранск, новости" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>За последние N дней:</label>
                    <input type="number" value={days} onChange={e => setDays(Number(e.target.value))} min="1" max="365" style={{ width: '100px', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                </div>
                <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '40px', padding: '10px 20px', color: 'white', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                    {loading ? 'Поиск...' : 'Найти во всех источниках'}
                </button>
            </form>

           {taskId && (
                <div style={{ margin: '20px 0', background: 'white', padding: '14px', borderRadius: '20px', border: '1px solid #dce3ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>Задача: {taskId} – статус: {taskStatus}</div>
                    <ExportCsvButton taskId={taskId} disabled={taskStatus !== 'completed'} />
                </div>
            )}


            {results.length > 0 && (
                <div style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '20px' }}>
                    <h3>Результаты ({results.length})</h3>
                    {currentPosts.map((res, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
                            {getSourceIcon(res.source) && <img src={getSourceIcon(res.source)} alt={res.source} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                            <div style={{ flex: 1 }}>
                                <a href={res.url} target="_blank" rel="noopener noreferrer"><strong>{res.page_title || 'Без заголовка'}</strong></a>
                                <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '20px' }}>{res.source || 'unknown'}</span>
                                <p><strong>Ключевое слово:</strong> {res.keyword}</p>
                                <p>{highlightKeyword(res.context, res.keyword)}</p>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <img src="https://img.icons8.com/ios-filled/100/000000/calendar--v1.png" alt="date" style={{ width: '14px', height: '14px' }} />
                                    {res.published_at || 'дата не указана'} | 
                                    {res.sentiment === 'positive' && '😊 Позитивный'}
                                    {res.sentiment === 'negative' && '😠 Негативный'}
                                    {res.sentiment === 'neutral' && '😐 Нейтральный'}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
                        <button onClick={() => setPage(p => Math.max(p-1,1))} disabled={page===1} style={{ padding: '6px 16px', borderRadius: '30px', border: 'none', background: '#e2e8f0', cursor: 'pointer' }}>◀ Назад</button>
                        <span>Страница {page} из {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(p+1, totalPages))} disabled={page===totalPages} style={{ padding: '6px 16px', borderRadius: '30px', border: 'none', background: '#e2e8f0', cursor: 'pointer' }}>Вперёд ▶</button>
                    </div>
                </div>
            )}
        </div>
    );
}