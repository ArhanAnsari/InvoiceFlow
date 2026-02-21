// src/store/authStore.ts
import { Models } from "appwrite";
import { router } from "expo-router";
import { create } from "zustand";
import { account } from "../services/appwrite";

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  checkSession: async () => {
    try {
      const user = await account.get();
      set({ user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await account.deleteSession("current");
      set({ user: null });
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  },
}));
