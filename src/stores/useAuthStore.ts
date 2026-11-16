/**
 * TOGETHERLY — AUTH STORE (ZUSTAND)
 */
import { create } from 'zustand';
import { UserProfile } from '@/types';
import { AuthService } from '@/services/firebase/authService';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (email: string, pass: string, name: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateAvatar: (avatarId: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: AuthService.getMockCurrentUser(),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  login: async (email, pass) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.login(email, pass);
      set({ user, isLoading: false });
      return user;
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (email, pass, name) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.register(email, pass, name);
      set({ user, isLoading: false });
      return user;
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await AuthService.logout();
    set({ user: null, isLoading: false });
  },

  updateAvatar: async (avatarId: string) => {
    await AuthService.updateAvatar(avatarId);
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, avatarId } });
    }
  },

  clearError: () => set({ error: null }),
}));

