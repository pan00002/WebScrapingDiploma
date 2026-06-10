import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export default function VkGroupFinder() {
    const [keyword, setKeyword] = useState('');
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!keyword.trim()) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/find_vk_communities`, { 
                params: { keyword, count: 20 } 
            });
            setGroups(res.data.communities);
        } catch (err) {
            console.error(err);
            alert('Ошибка поиска групп');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
            <h3>Поиск сообществ ВКонтакте</h3>
            <div>
                <input 
                    type="text" 
                    value={keyword} 
                    onChange={e => setKeyword(e.target.value)} 
                    placeholder="например: Мордовия"
                    style={{ width: '250px', marginRight: '10px', padding: '8px' }}
                />
                <button onClick={handleSearch} disabled={loading}>
                    {loading ? 'Поиск...' : 'Найти группы'}
                </button>
            </div>
            {groups.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                    {groups.map(g => (
                        <li key={g.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            {g.photo_url && (
                                <img src={g.photo_url} alt={g.name} style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '15px' }} />
                            )}
                            <div>
                                <a href={`https://vk.com/${g.screen_name}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>
                                    {g.name}
                                </a>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Участников: {g.members.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                    Короткое имя: <code>{g.screen_name}</code>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}