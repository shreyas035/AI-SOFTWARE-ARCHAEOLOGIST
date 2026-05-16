import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * API client configuration and setup
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;

    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (message) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * API service methods
 */

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    apiClient.post('/auth/register', { name, email, password }),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  getCurrentUser: () =>
    apiClient.get('/auth/me'),
  
  refreshToken: () =>
    apiClient.post('/auth/refresh'),
};

// Repository endpoints
export const repositoryApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/repositories', { params }),
  
  getById: (id: string) =>
    apiClient.get(`/repositories/${id}`),
  
  create: (data: FormData) =>
    apiClient.post('/repositories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (id: string, data: any) =>
    apiClient.patch(`/repositories/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete(`/repositories/${id}`),
  
  getFileTree: (id: string) =>
    apiClient.get(`/repositories/${id}/files`),
  
  getFileContent: (id: string, path: string) =>
    apiClient.get(`/repositories/${id}/files/content`, { params: { path } }),
};

// Analysis endpoints
export const analysisApi = {
  getByRepositoryId: (repositoryId: string) =>
    apiClient.get(`/analysis/${repositoryId}`),
  
  getTechnicalDebt: (repositoryId: string) =>
    apiClient.get(`/analysis/${repositoryId}/technical-debt`),
  
  getMetrics: (repositoryId: string) =>
    apiClient.get(`/analysis/${repositoryId}/metrics`),
  
  getDependencies: (repositoryId: string) =>
    apiClient.get(`/analysis/${repositoryId}/dependencies`),
};

// Architecture endpoints
export const architectureApi = {
  getByRepositoryId: (repositoryId: string) =>
    apiClient.get(`/architecture/${repositoryId}`),
  
  generateMap: (repositoryId: string) =>
    apiClient.post(`/architecture/${repositoryId}/generate`),
  
  updateNode: (repositoryId: string, nodeId: string, data: any) =>
    apiClient.patch(`/architecture/${repositoryId}/nodes/${nodeId}`, data),
};

// Chat endpoints
export const chatApi = {
  getSessions: (repositoryId: string) =>
    apiClient.get(`/chat/${repositoryId}/sessions`),
  
  getSession: (repositoryId: string, sessionId: string) =>
    apiClient.get(`/chat/${repositoryId}/sessions/${sessionId}`),
  
  createSession: (repositoryId: string, title?: string) =>
    apiClient.post(`/chat/${repositoryId}/sessions`, { title }),
  
  sendMessage: (repositoryId: string, sessionId: string, message: string) =>
    apiClient.post(`/chat/${repositoryId}/sessions/${sessionId}/messages`, { message }),
  
  deleteSession: (repositoryId: string, sessionId: string) =>
    apiClient.delete(`/chat/${repositoryId}/sessions/${sessionId}`),
};

// Documentation endpoints
export const documentationApi = {
  getByRepositoryId: (repositoryId: string) =>
    apiClient.get(`/documentation/${repositoryId}`),
  
  generate: (repositoryId: string, type: string) =>
    apiClient.post(`/documentation/${repositoryId}/generate`, { type }),
  
  update: (repositoryId: string, docId: string, content: string) =>
    apiClient.patch(`/documentation/${repositoryId}/${docId}`, { content }),
};

// Onboarding endpoints
export const onboardingApi = {
  getStatus: (repositoryId: string) =>
    apiClient.get(`/onboarding/${repositoryId}/status`),
  
  start: (repositoryId: string) =>
    apiClient.post(`/onboarding/${repositoryId}/start`),
  
  complete: (repositoryId: string) =>
    apiClient.post(`/onboarding/${repositoryId}/complete`),
};

// Made with Bob
