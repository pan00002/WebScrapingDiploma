import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import UnifiedSearch from './UnifiedSearch';
import VkAutoSearch from './VkAutoSearch';
import OkPresetSearch from './OkPresetSearch';
import RssSearch from './RssSearch';
import CustomUrlSearch from './CustomUrlSearch';

function App() {
    const navItems = [
        { path: '/', label: 'Общий поиск', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
        { path: '/vk', label: 'VK', color: '#2a6bb1' },
        { path: '/ok', label: 'Одноклассники', color: '#f58220' },
        { path: '/rss', label: 'RSS', color: '#cc0000' },
        { path: '/custom', label: 'Свой поиск', color: '#2c3e50' },
    ];

    // Активная вкладка: белый фон, тёмный текст; неактивная: цветной фон, белый текст
    const getButtonStyle = ({ isActive }, baseColor) => ({
        padding: '8px 20px',
        borderRadius: '40px',
        border: 'none',
        backgroundColor: isActive ? 'green' : baseColor,
        color: isActive ? '#1f2937' : '#ffffff',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.9rem',
        textDecoration: 'none',
        transition: '0.2s',
        display: 'inline-block',
        textAlign: 'center',
        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 32px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{
                    fontWeight: 'bold',
                    fontSize: '1.6rem',
                    background: 'linear-gradient(45deg, #2c3e50, #3498db)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                }}>
                    🔍 WebScraper
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => getButtonStyle({ isActive }, item.color)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </header>

            <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
                <Routes>
                    <Route path="/" element={<UnifiedSearch />} />
                    <Route path="/vk" element={
                        <div style={{ background: '#ffffff', borderRadius: '32px', padding: '24px', boxShadow: '0 25px 40px -12px rgba(0,0,0,0.2)' }}>
                            <VkAutoSearch />
                        </div>
                    } />
                    <Route path="/ok" element={
                        <div style={{ background: '#ffffff', borderRadius: '32px', padding: '24px', boxShadow: '0 25px 40px -12px rgba(0,0,0,0.2)' }}>
                            <OkPresetSearch />
                        </div>
                    } />
                    <Route path="/rss" element={
                        <div style={{ background: '#ffffff', borderRadius: '32px', padding: '24px', boxShadow: '0 25px 40px -12px rgba(0,0,0,0.2)' }}>
                            <RssSearch />
                        </div>
                    } />
                    <Route path="/custom" element={
                        <div style={{ background: '#ffffff', borderRadius: '32px', padding: '24px', boxShadow: '0 25px 40px -12px rgba(0,0,0,0.2)' }}>
                            <CustomUrlSearch />
                        </div>
                    } />
                </Routes>
            </div>
        </div>
    );
}

export default App;