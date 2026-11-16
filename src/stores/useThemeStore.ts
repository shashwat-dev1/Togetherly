/**
 * TOGETHERLY — THEME STORE (ZUSTAND)
 */
import { create } from 'zustand';
import { AppTheme, LightTheme, DarkTheme } from '@/constants/tokens';

interface ThemeState {
  isDark: boolean;
  theme: AppTheme;
  toggleTheme: () => void;
  setThemeMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  theme: LightTheme,

  toggleTheme: () =>
    set((state) => {
      const isDark = !state.isDark;
      return {
        isDark,
        theme: isDark ? DarkTheme : LightTheme,
      };
    }),

  setThemeMode: (isDark) =>
    set({
      isDark,
      theme: isDark ? DarkTheme : LightTheme,
    }),
}));

