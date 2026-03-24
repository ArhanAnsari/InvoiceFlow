// src/store/notificationStore.ts
import { create } from "zustand";
import {
    Notification,
    getUnreadCount,
    listNotificationsForUser,
    markAllNotificationsRead,
    markNotificationRead,
    subscribeToNotifications,
    unsubscribeFromNotifications,
} from "../services/notificationService";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (userId: string, businessId?: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeToUpdates: (userId: string) => void;
  unsubscribeFromUpdates: () => void;
  refreshUnreadCount: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string, businessId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await listNotificationsForUser(userId, businessId);
      set({
        notifications: response.documents as unknown as Notification[],
        unreadCount: response.documents.filter((n: any) => !n.isRead).length,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
      console.error("Failed to fetch notifications:", error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.$id === notificationId ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await markAllNotificationsRead(userId);

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  subscribeToUpdates: (userId: string) => {
    subscribeToNotifications(userId, (newNotification: Notification) => {
      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: newNotification.isRead
          ? state.unreadCount
          : state.unreadCount + 1,
      }));
    });
  },

  unsubscribeFromUpdates: () => {
    unsubscribeFromNotifications();
  },

  refreshUnreadCount: async (userId: string) => {
    try {
      const count = await getUnreadCount(userId);
      set({ unreadCount: count });
    } catch (error) {
      console.error("Failed to refresh unread count:", error);
    }
  },
}));
