// frontend/src/SentimentStats.jsx
import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getSentimentStats } from './api';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SentimentStats({ taskId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!taskId) {
            setStats(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        getSentimentStats(taskId)
            .then(data => {
                setStats(data.stats);
                setLoading(false);
            })
            .catch(err => {
                console.error('Ошибка загрузки статистики тональности:', err);
                setLoading(false);
            });
    }, [taskId]);

    if (loading) {
        return <div style={{ textAlign: 'center', margin: '20px' }}>Загрузка анализа тональности...</div>;
    }
    if (!taskId) {
        return <div style={{ textAlign: 'center', margin: '20px' }}>Выполните поиск, чтобы увидеть анализ тональности.</div>;
    }
    if (!stats || stats.total === 0) {
        return <div style={{ textAlign: 'center', margin: '20px' }}>Нет данных для анализа тональности.</div>;
    }

    const chartData = {
        labels: ['Позитивные', 'Негативные', 'Нейтральные'],
        datasets: [
            {
                data: [stats.positive, stats.negative, stats.neutral],
                backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const total = stats.total;
                        const percent = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${percent}%)`;
                    },
                },
            },
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <div style={{ width: '300px', margin: '20px auto', textAlign: 'center' }}>
            <h4>Тональность найденных постов</h4>
            <Doughnut data={chartData} options={options} />
            <p>Всего проанализировано: <strong>{stats.total}</strong></p>
        </div>
    );
}