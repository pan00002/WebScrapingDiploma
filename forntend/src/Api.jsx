import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const startSearch = async (keywords, sites, config = {}) => {
    const response = await axios.post(`${API_BASE}/search`, {
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        sites: sites.split('\n').map(s => s.trim()).filter(s => s),
        config: { context_window: config.contextWindow || 150 }
    });
    return response.data;
};

export const vkSearch = async (keywords, groups, config = {}) => {
    const response = await axios.post(`${API_BASE}/vk_search`, {
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        sites: groups.split('\n').map(g => g.trim()).filter(g => g),
        config: { context_window: config.contextWindow || 150 }
    });
    return response.data;
};

export const getTaskStatus = async (taskId) => {
    const response = await axios.get(`${API_BASE}/task/${taskId}`);
    return response.data;
};