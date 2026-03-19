// src/store/authStore.ts
import { Models } from "appwrite";
import { router } from "expo-router";
import { create } from "zustand";
import { account, ID } from "../services/appwrite";

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
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
  login: async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
    } catch (error: any) {
      // "Creation of a session is prohibited when a session is already active"
      const msg: string = error?.message ?? "";
      if (
        msg.toLowerCase().includes("session is active") ||
        msg.toLowerCase().includes("prohibited") ||
        error?.code === 401
      ) {
        // Force-delete the stale session and retry once
        try {
          await account.deleteSession("current");
        } catch (_) {
          // ignore — session may already be invalid
        }
        await account.createEmailPasswordSession(email, password);
      } else {
        throw error;
      }
    }
    const user = await account.get();
    set({ user });
    router.replace("/(main)");
  },
  register: async (email: string, password: string, name: string) => {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    set({ user });
    router.replace("/(main)");
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
