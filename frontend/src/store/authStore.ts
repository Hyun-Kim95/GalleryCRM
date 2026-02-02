import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, AuthResponse } from '../api/auth.api';

interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        localStorage.setItem('accessToken', response.accessToken);
        set({
          user: response.user,
          token: response.accessToken,
          isAuthenticated: true,
        });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

