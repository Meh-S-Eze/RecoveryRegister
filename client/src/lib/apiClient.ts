import { toast } from 'react-hot-toast';

interface RequestOptions extends RequestInit {
  showError?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

/**
 * Wrapper for fetch API with error handling and authentication
 */
export async function safeFetch<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { showError = true, ...fetchOptions } = options;

  try {
    // Always include credentials for authentication
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = new Error('API request failed');
      error.status = response.status;
      
      try {
        error.data = await response.json();
      } catch {
        error.data = { message: response.statusText };
      }

      throw error;
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error: any) {
    if (showError) {
      const message = error.data?.message || error.message || 'An error occurred';
      toast.error(message);
    }
    
    // Special handling for authentication errors
    if (error.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
    
    throw error;
  }
}

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  registration: {
    create: '/api/registration',
    complete: '/api/registration/complete',
  },
  sessions: {
    list: '/api/sessions',
    create: '/api/sessions',
    update: (id: string) => `/api/sessions/${id}`,
    delete: (id: string) => `/api/sessions/${id}`,
  },
};

// Type-safe API client methods
export const apiClient = {
  // Auth methods
  auth: {
    login: (credentials: { identifier: string; password: string }) =>
      safeFetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
      
    register: (data: any) =>
      safeFetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      
    logout: () =>
      safeFetch(API_ENDPOINTS.auth.logout, {
        method: 'POST',
      }),
      
    getProfile: () =>
      safeFetch(API_ENDPOINTS.auth.me),
  },

  // Registration methods
  registration: {
    create: (data: any) =>
      safeFetch(API_ENDPOINTS.registration.create, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      
    complete: (data: any) =>
      safeFetch(API_ENDPOINTS.registration.complete, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Session methods
  sessions: {
    list: () =>
      safeFetch(API_ENDPOINTS.sessions.list),
      
    create: (data: any) =>
      safeFetch(API_ENDPOINTS.sessions.create, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      
    update: (id: string, data: any) =>
      safeFetch(API_ENDPOINTS.sessions.update(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      
    delete: (id: string) =>
      safeFetch(API_ENDPOINTS.sessions.delete(id), {
        method: 'DELETE',
      }),
  },
}; 