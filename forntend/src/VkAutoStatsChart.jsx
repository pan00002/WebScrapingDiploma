import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function VkAutoStatsChart({ taskId, status }) {
    const [stats, setStats] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === 'completed' && taskId) {
            setLoading(true);
            fetch(`http://localhost:8000/api/stats/vk_task/${taskId}`)
                .then(res => res.json())
                .then(data => {
                    setStats(data.stats);
                    setTotal(data.total);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [taskId, status]);

    if (status !== 'completed') {
        return <p style={{ textAlign: 'center' }}>Поиск выполняется... Диаграмма появится после завершения.</p>;
    }
    if (loading) return <p>Загрузка статистики...</p>;
    if (!stats.length) return <p>По данной задаче совпадений не найдено.</p>;

    const chartData = {
        labels: stats.map(s => `${s.keyword} (${s.count})`),
        datasets: [{
            data: stats.map(s => s.count),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            hoverOffset: 4,
        }],
    };

    const options = {
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw;
                        const percent = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percent}%)`;
                    }
                }
            }
        }
    };

    return (
        <div style={{ width: '400px', margin: '20px auto', textAlign: 'center' }}>
            <h3>Результаты последнего поиска ВК</h3>
            <Pie data={chartData} options={options} />
            <p>Всего найдено постов: <strong>{total}</strong></p>
        </div>
    );
}