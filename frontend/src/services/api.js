import axios from 'axios';

/**
 * Determine the API base URL:
 * - Electron desktop app  → uses the stored server URL from window.electronAPI.getConfig or localStorage
 * - Web browser           → uses relative '/api' (works with Vite dev proxy and production same-origin)
 *
 * Do not hardcode a localhost URL for browser builds.
 */
const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);

const getBaseURL = () => {
    if (!isElectron) {
        return '/api';
    }
    // Prefer electronAPI config if available, fallback to localStorage, then default
    const cfg = window.electronAPI?.getConfig?.() || {};
    return cfg.serverUrl || localStorage.getItem('server_url') || 'http://127.0.0.1:8000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ─────────────────────────────────────────────
// REQUEST INTERCEPTOR — attach bearer token if present
// ─────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// RESPONSE INTERCEPTOR — handle auth errors (401)
// ─────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // clear auth and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            try {
                window.location.href = '/login';
            } catch (e) {
                // ignore if not in browser context
            }
        }
        return Promise.reject(error);
    }
);

// ─────────────────────────────────────────────
// Online helper
// ─────────────────────────────────────────────
export const isOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const authAPI = {
    login: (email, password) =>
        api.post('/login', { email, password }),

    logout: () =>
        api.post('/logout'),

    me: () =>
        api.get('/me'),

    changePassword: (data) =>
        api.post('/change-password', {
            current_password:      data.current_password,
            password:              data.password,
            password_confirmation: data.password_confirmation ?? data.password,
        }),
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
export const dashboardAPI = {
    getData: () => api.get('/dashboard'),
    getAlerts: () => api.get('/dashboard/alerts'),
};

// ─────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────
export const postsAPI = {
    list: (params = {}) => api.get('/posts', { params }),
    get: (id) => api.get(`/posts/${id}`),
    create: (data) => api.post('/posts', data),
    update: (id, data) => api.put(`/posts/${id}`, data),
    updateStatus: (id, status, comments = '') => api.patch(`/posts/${id}/status`, { overall_status: status, comments }),
    getAuditHistory: (id) => api.get(`/posts/${id}/audit`),
    getTcExpiring: () => api.get('/posts/tc-expiring'),
    getCritical: () => api.get('/posts/critical'),
};

// ─────────────────────────────────────────────
// REFERENCE DATA
// ─────────────────────────────────────────────
export const referenceAPI = {
    getAll: () => api.get('/reference'),
};

// ─────────────────────────────────────────────
// FACILITIES
// ─────────────────────────────────────────────
export const facilitiesAPI = {
    list: () => api.get('/facilities'),
    get: (id) => api.get(`/facilities/${id}`),
    create: (data) => api.post('/facilities', data),
    update: (id, data) => api.put(`/facilities/${id}`, data),
};

// ─────────────────────────────────────────────
// DISTRICTS
// ─────────────────────────────────────────────
export const districtsAPI = {
    list: () => api.get('/districts'),
    get: (id) => api.get(`/districts/${id}`),
};

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const usersAPI = {
    list: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
};

// ─────────────────────────────────────────────
// REPORTS — blob responses for file downloads
// ─────────────────────────────────────────────
export const reportsAPI = {
    provincialSummary: (params = {}) => api.get('/reports/provincial-summary', { params, responseType: 'blob' }),
    districtReport: (districtId, params = {}) => api.get(`/reports/district/${districtId}`, { params, responseType: 'blob' }),
    facilityReport: (facilityId, params = {}) => api.get(`/reports/facility/${facilityId}`, { params, responseType: 'blob' }),
    tcStatusReport: (params = {}) => api.get('/reports/tc-status', { params, responseType: 'blob' }),
    criticalPostsReport: (params = {}) => api.get('/reports/critical-posts', { params, responseType: 'blob' }),
    locumCostReport: (params = {}) => api.get('/reports/locum-cost', { params, responseType: 'blob' }),
    longestVacancies: (params = {}) => api.get('/reports/longest-vacancies', { params }),
    monthlyTrend: () => api.get('/reports/monthly-trend'),
    districtBenchmark: () => api.get('/reports/district-benchmark'),
};

// ─────────────────────────────────────────────
// DOWNLOAD HELPER
// Triggers browser/Electron file save for blob responses
// ─────────────────────────────────────────────
export const downloadFile = async (blobPromise, filename) => {
    const response = await blobPromise;
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
    const url = (typeof window !== 'undefined') ? window.URL.createObjectURL(blob) : null;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export default api;