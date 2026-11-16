/**
 * TOGETHERLY — COUPLE STORE (ZUSTAND)
 */
import { create } from 'zustand';
import { CoupleProfile, CoupleInvitation, UserProfile } from '@/types';
import { CoupleService } from '@/services/firebase/coupleService';
import { runtimeMode } from '@/services/firebase/config';

interface CoupleState {
  couple: CoupleProfile | null;
  activeInvitation: CoupleInvitation | null;
  isLoading: boolean;
  error: string | null;
  fetchCouple: (coupleId?: string | null) => Promise<void>;
  createInvite: (user: UserProfile) => Promise<CoupleInvitation>;
  pairWithCode: (code: string, user: UserProfile) => Promise<CoupleProfile>;
  disconnect: () => Promise<void>;
  updateSharedXP: (newXP: number, newLevel: number) => void;
  updateStreak: (streakData: any) => void;
  setCouple: (couple: CoupleProfile | null) => void;
  clearError: () => void;
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  couple: runtimeMode === 'mock' ? CoupleService.getMockCurrentCouple() : null,
  activeInvitation: null,
  isLoading: false,
  error: null,

  fetchCouple: async (coupleId) => {
    set({ isLoading: true });
    try {
      const couple = await CoupleService.getActiveCouple(coupleId);
      set({ couple, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createInvite: async (user) => {
    set({ isLoading: true, error: null });
    try {
      const activeInvitation = await CoupleService.createInvitation(user);
      set({ activeInvitation, isLoading: false });
      return activeInvitation;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create invitation', isLoading: false });
      throw err;
    }
  },

  pairWithCode: async (code, user) => {
    set({ isLoading: true, error: null });
    try {
      const couple = await CoupleService.acceptInvitation(code, user);
      set({ couple, isLoading: false });
      return couple;
    } catch (err: any) {
      set({ error: err.message || 'Invalid or expired code', isLoading: false });
      throw err;
    }
  },

  disconnect: async () => {
    set({ isLoading: true });
    const couple = get().couple;
    await CoupleService.disconnectCouple(couple?.id);
    set({ couple: null, isLoading: false });
  },

  updateSharedXP: (newXP: number, newLevel: number) => {
    const current = get().couple;
    if (current) {
      set({
        couple: {
          ...current,
          sharedXP: newXP,
          coupleLevel: newLevel,
        },
      });
    }
  },

  updateStreak: (streakData: any) => {
    const current = get().couple;
    if (current) {
      set({
        couple: {
          ...current,
          streakData,
        },
      });
    }
  },

  setCouple: (couple) => set({ couple }),
  clearError: () => set({ error: null }),
}));
