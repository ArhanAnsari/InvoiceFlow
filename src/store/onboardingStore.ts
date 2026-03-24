import { create } from "zustand";
import db from "../services/database";

export type OnboardingTask = {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  completedAt?: string;
};

const DEFAULT_TASKS: OnboardingTask[] = [
  {
    id: "business",
    title: "Complete business setup",
    points: 20,
    completed: false,
  },
  { id: "products", title: "Add first product", points: 20, completed: false },
  {
    id: "customers",
    title: "Add first customer",
    points: 15,
    completed: false,
  },
  {
    id: "invoice",
    title: "Create first invoice",
    points: 20,
    completed: false,
  },
  {
    id: "payment",
    title: "Record first payment",
    points: 15,
    completed: false,
  },
  {
    id: "automation",
    title: "Open notifications/activity",
    points: 10,
    completed: false,
  },
];

type OnboardingState = {
  tasks: OnboardingTask[];
  isLoading: boolean;
  loadProgress: () => Promise<void>;
  markCompleted: (taskId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  tasks: DEFAULT_TASKS,
  isLoading: false,

  loadProgress: async () => {
    set({ isLoading: true });
    try {
      const rows = await db.getAllAsync<any>(
        "SELECT id, completed, completedAt FROM onboarding_progress",
      );

      const map = new Map<
        string,
        { completed: number; completedAt?: string }
      >();
      for (const row of rows) {
        map.set(String(row.id), {
          completed: Number(row.completed || 0),
          completedAt: row.completedAt || undefined,
        });
      }

      const merged = DEFAULT_TASKS.map((task) => {
        const value = map.get(task.id);
        return {
          ...task,
          completed: value ? Number(value.completed) === 1 : false,
          completedAt: value?.completedAt,
        };
      });

      set({ tasks: merged, isLoading: false });
    } catch (error) {
      console.error("Failed to load onboarding progress:", error);
      set({ isLoading: false });
    }
  },

  markCompleted: async (taskId) => {
    const now = new Date().toISOString();
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO onboarding_progress (id, completed, completedAt, updatedAt) VALUES (?, 1, ?, ?)",
        [taskId, now, now],
      );

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: true, completedAt: now }
            : task,
        ),
      }));
    } catch (error) {
      console.error("Failed to mark onboarding task complete:", error);
      throw error;
    }
  },

  resetProgress: async () => {
    try {
      await db.runAsync("DELETE FROM onboarding_progress");
      set({ tasks: DEFAULT_TASKS.map((task) => ({ ...task })) });
    } catch (error) {
      console.error("Failed to reset onboarding progress:", error);
      throw error;
    }
  },
}));
