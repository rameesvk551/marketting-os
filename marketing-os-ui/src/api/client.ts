import axios from 'axios';
import config from '../config';

// Create Axios client
const client = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add Interceptors for Auth
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Tenant ID
    config.headers['x-tenant-id'] = localStorage.getItem('tenantId') || 'default';
    return config;
});

export default client;
