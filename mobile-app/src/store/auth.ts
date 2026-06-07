import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: { id: string; email: string; username: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setToken: async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
    set({ token, isAuthenticated: true });
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch('${API_BASE_URL}/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      await AsyncStorage.setItem('auth_token', data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  restoreToken: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        set({ token, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Token restore error:', error);
    }
  },
}));
