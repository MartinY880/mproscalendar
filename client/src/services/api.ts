/**
 * API Service
 * Axios instance and API methods
 */

import axios, { AxiosError } from 'axios';
import type { 
  Holiday, 
  HolidayFormData, 
  LoginResponse, 
  DashboardStats, 
  SyncResult,
  SyncLog,
  Settings,
  ApiError 
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ============ Auth API ============

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { username, password });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }
};

// ============ Holidays API ============

export const holidaysApi = {
  getAll: async (params?: { year?: string; category?: string; includeHidden?: boolean }): Promise<Holiday[]> => {
    const response = await api.get<Holiday[]>('/holidays', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Holiday> => {
    const response = await api.get<Holiday>(`/holidays/${id}`);
    return response.data;
  },

  create: async (data: HolidayFormData): Promise<Holiday> => {
    const response = await api.post<Holiday>('/holidays', {
      ...data,
      source: 'custom'
    });
    return response.data;
  },

  update: async (id: number, data: Partial<HolidayFormData>): Promise<Holiday> => {
    const response = await api.put<Holiday>(`/holidays/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/holidays/${id}`);
  },

  toggleVisibility: async (id: number, visible: boolean): Promise<Holiday> => {
    const response = await api.patch<Holiday>(`/holidays/${id}/visibility`, { visible });
    return response.data;
  },

  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/holidays/stats/summary');
    return response.data;
  }
};

// ============ Sync API ============

export const syncApi = {
  sync: async (year?: number): Promise<{ message: string; synced: SyncResult }> => {
    const response = await api.post('/sync-holidays', { year });
    return response.data;
  },

  getLogs: async (limit?: number): Promise<SyncLog[]> => {
    const response = await api.get<SyncLog[]>('/sync-holidays/logs', { params: { limit } });
    return response.data;
  }
};

// ============ Settings API ============

export const settingsApi = {
  getAll: async (): Promise<Settings> => {
    const response = await api.get<Settings>('/settings');
    return response.data;
  },

  getLogo: async (): Promise<{ logoUrl: string | null }> => {
    const response = await api.get<{ logoUrl: string | null }>('/settings/logo');
    return response.data;
  },

  uploadLogo: async (file: File): Promise<{ message: string; logoUrl: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await api.post<{ message: string; logoUrl: string }>('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteLogo: async (): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>('/settings/logo');
    return response.data;
  },

  update: async (key: string, value: string): Promise<Settings> => {
    const response = await api.put<Settings>(`/settings/${key}`, { value });
    return response.data;
  }
};

export default api;
