const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<{ data: T; error?: null } | { error: ApiError; data?: null }> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        return {
          error: {
            message: `HTTP ${response.status}`,
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        error: {
          message,
          status: 0,
        },
      };
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
