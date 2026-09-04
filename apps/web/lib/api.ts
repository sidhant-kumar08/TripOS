import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from './runtime-config';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (email: string, name: string, password: string) =>
    api.post('/auth/register', { email, name, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const tripsApi = {
  create: (data: any) => api.post('/trips', data),
  list: () => api.get('/trips'),
  getById: (tripId: string) => api.get(`/trips/${tripId}`),
  invite: (tripId: string, email: string) =>
    api.post(`/trips/${tripId}/invite`, { email }),
  acceptInvitation: (token: string) =>
    api.post('/trips/invitations/accept', { token }),
};

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
};

export default api;
