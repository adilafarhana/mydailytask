import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BASE_URL.replace(/\/$/, '')}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor to attach Bearer token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API Calls
export const registerUser = async (data) => {
  const response = await api.post('/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post('/login', data);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/me');
  return response.data;
};

// Daily Logs API Calls
export const getDailyLogs = async (params = {}) => {
  const response = await api.get('/daily-logs', { params });
  return response.data;
};

export const getDailyLogSummary = async () => {
  const response = await api.get('/daily-logs/summary');
  return response.data;
};

export const getDailyLogById = async (id) => {
  const response = await api.get(`/daily-logs/${id}`);
  return response.data;
};

export const createDailyLog = async (data) => {
  const response = await api.post('/daily-logs', data);
  return response.data;
};

export const updateDailyLog = async (id, data) => {
  const response = await api.put(`/daily-logs/${id}`, data);
  return response.data;
};

export const deleteDailyLog = async (id) => {
  const response = await api.delete(`/daily-logs/${id}`);
  return response.data;
};

export default api;
