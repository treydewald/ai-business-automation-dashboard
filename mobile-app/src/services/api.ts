import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const workflowApi = {
  listWorkflows: (skip = 0, limit = 20) =>
    api.get('/workflows', { params: { skip, limit } }),
  getWorkflow: (id: string) => api.get(`/workflows/${id}`),
  triggerWorkflow: (id: string, data?: any) =>
    api.post(`/workflows/${id}/run`, data),
  getExecutions: (workflowId?: string, skip = 0, limit = 20) =>
    api.get('/executions', { params: { workflow_id: workflowId, skip, limit } }),
  getExecution: (id: string) => api.get(`/executions/${id}`),
  getLogs: (executionId: string) =>
    api.get(`/executions/${executionId}/logs`),
};

export const healthApi = {
  getHealth: () => api.get('/health'),
};

export default api;
