import axios from 'axios';

import apiClient from './apiClient';

// Auth API Calls
export const registerUser = async (data) => {
  const response = await apiClient.post('/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await apiClient.post('/login', data);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post('/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/me');
  return response.data;
};

// Daily Logs API Calls
export const getDailyLogs = async (params = {}) => {
  const response = await apiClient.get('/daily-logs', { params });
  return response.data;
};

export const getDailyLogSummary = async () => {
  const response = await apiClient.get('/daily-logs/summary');
  return response.data;
};

export const getDailyLogById = async (id) => {
  const response = await apiClient.get(`/daily-logs/${id}`);
  return response.data;
};

export const createDailyLog = async (data) => {
  const response = await apiClient.post('/daily-logs', data);
  return response.data;
};

export const updateDailyLog = async (id, data) => {
  const response = await apiClient.put(`/daily-logs/${id}`, data);
  return response.data;
};

export const deleteDailyLog = async (id) => {
  const response = await apiClient.delete(`/daily-logs/${id}`);
  return response.data;
};

export default apiClient;
