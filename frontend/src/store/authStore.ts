import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, AuthResponse } from '../api/auth.api';

interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
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
      initializeAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false });
          return;
        }

        try {
          const response = await authApi.verify();
          set({
            user: response.user,
            token: token,
            isAuthenticated: true,
            isInitialized: true,
          });
        } catch (error) {
          // 토큰이 유효하지 않으면 로그아웃 처리
          localStorage.removeItem('accessToken');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
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










