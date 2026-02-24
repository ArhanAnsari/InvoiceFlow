// src/store/uiStore.ts — InvoiceFlow v2
import { Toast } from "@/src/types";
import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

interface UIState {
  themeMode: ThemeMode;
  toasts: Toast[];
  isGlobalLoading: boolean;
  searchQuery: string;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: "dark",
  toasts: [],
  isGlobalLoading: false,
  searchQuery: "",

  setThemeMode: (mode) => set({ themeMode: mode }),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: Toast = { id, duration: 3000, ...toast };
    set((s) => ({ toasts: [...s.toasts, newToast] }));
    // auto-remove
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, newToast.duration);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
