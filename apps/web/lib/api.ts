import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from './runtime-config';

// Client-side Memory Cache for instantaneous tab switches
const clientCache = new Map<string, { data: any; status: number; headers: any; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 15000; // 15 seconds

export function invalidateClientCache(pattern?: string | RegExp) {
  if (!pattern) {
    clientCache.clear();
    return;
  }
  for (const key of Array.from(clientCache.keys())) {
    if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
      clientCache.delete(key);
    }
  }
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests & serve from memory cache if valid
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Handle client-side cache for GET requests
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get') {
    const cacheKey = `${config.url || ''}:${JSON.stringify(config.params || {})}`;
    const cached = clientCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
      // Return cached response via custom adapter-like resolved promise
      config.adapter = async () => ({
        data: cached.data,
        status: cached.status,
        statusText: 'OK (Memory Cache)',
        headers: cached.headers,
        config,
        request: {},
      });
    }
  } else {
    // Invalidate client cache on any write mutation (POST, PUT, DELETE, PATCH)
    const url = config.url || '';
    const tripMatch = url.match(/\/trips\/([^/]+)/);
    if (tripMatch) {
      invalidateClientCache(tripMatch[1]);
    } else {
      invalidateClientCache();
    }
  }

  return config;
});

// Handle caching responses and token refresh on 401
api.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'get').toLowerCase();
    if (method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.url || ''}:${JSON.stringify(response.config.params || {})}`;
      clientCache.set(cacheKey, {
        data: response.data,
        status: response.status,
        headers: response.headers,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
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
  googleCallback: (data: { code: string; redirectUri: string }) =>
    api.post('/auth/google/callback', data),
  googleVerifyToken: (data: { idToken: string }) =>
    api.post('/auth/google/verify-token', data),
  facebookCallback: (data: { code: string; redirectUri: string }) =>
    api.post('/auth/facebook/callback', data),
  oauthLogin: (data: { provider: 'google' | 'facebook' | 'apple'; email: string; name: string; avatar?: string; providerId?: string }) =>
    api.post('/auth/oauth', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

export const tripsApi = {
  create: (data: any) => api.post('/trips', data),
  list: () => api.get('/trips'),
  getById: (tripId: string) => api.get(`/trips/${tripId}`),
  invite: (tripId: string, email: string) =>
    api.post(`/trips/${tripId}/invite`, { email }),
  getInvitation: (token: string) =>
    api.get(`/trips/invitations/${token}`),
  acceptInvitation: (token: string) =>
    api.post('/trips/invitations/accept', { token }),
  declineInvitation: (token: string) =>
    api.post('/trips/invitations/decline', { token }),
  getMyPendingInvitations: () =>
    api.get('/trips/invitations/my-pending'),
  getTripPendingInvitations: (tripId: string) =>
    api.get(`/trips/${tripId}/invitations`),
  revokeInvitation: (tripId: string, invitationId: string) =>
    api.delete(`/trips/${tripId}/invitations/${invitationId}`),
};

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
};

export const expensesApi = {
  getOverview: (tripId: string) => api.get(`/trips/${tripId}/expenses/overview`),
  list: (tripId: string) => api.get(`/trips/${tripId}/expenses`),
  getById: (tripId: string, expenseId: string) => api.get(`/trips/${tripId}/expenses/${expenseId}`),
  create: (tripId: string, data: any) => api.post(`/trips/${tripId}/expenses`, data),
  update: (tripId: string, expenseId: string, data: any) => api.put(`/trips/${tripId}/expenses/${expenseId}`, data),
  delete: (tripId: string, expenseId: string) => api.delete(`/trips/${tripId}/expenses/${expenseId}`),
  getHistory: (tripId: string, expenseId: string) => api.get(`/trips/${tripId}/expenses/${expenseId}/history`),
  getBalances: (tripId: string) => api.get(`/trips/${tripId}/expenses/balances/all`),
  getSettlements: (tripId: string) => api.get(`/trips/${tripId}/expenses/settlement/suggestions`),
};

export const itineraryApi = {
  list: (tripId: string) => api.get(`/trips/${tripId}/activities`),
  create: (tripId: string, data: any) => api.post(`/trips/${tripId}/activities`, data),
  delete: (tripId: string, activityId: string) => api.delete(`/trips/${tripId}/activities/${activityId}`),
};

export const tasksApi = {
  list: (tripId: string) => api.get(`/trips/${tripId}/tasks`),
  create: (tripId: string, data: any) => api.post(`/trips/${tripId}/tasks`, data),
  update: (tripId: string, taskId: string, data: any) => api.put(`/trips/${tripId}/tasks/${taskId}`, data),
  delete: (tripId: string, taskId: string) => api.delete(`/trips/${tripId}/tasks/${taskId}`),
};

export const commandCenterApi = {
  getOverview: (tripId: string) => api.get(`/trips/${tripId}/overview`),
};

export const aiApi = {
  chat: (text: string, tripId?: string) =>
    api.post('/ai/chat', { text, tripId }),
  parseExpense: (tripId: string, text: string) =>
    api.post(`/trips/${tripId}/ai/parse-expense`, { text }),
  parseTask: (tripId: string, text: string) =>
    api.post(`/trips/${tripId}/ai/parse-task`, { text }),
  ask: (tripId: string, question: string) =>
    api.post(`/trips/${tripId}/ai/ask`, { question }),
  getBriefing: (tripId: string) =>
    api.get(`/trips/${tripId}/ai/briefing`),
};

export default api;

