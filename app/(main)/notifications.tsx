import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter =
  | "all"
  | "unread"
  | "read"
  | "low_stock"
  | "invoice_due"
  | "payment_received";

export default function NotificationCenterScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();

  const { user } = useAuthStore() as any;
  const { currentBusiness } = useBusinessStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  } = useNotificationStore();

  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!user?.$id) return;
    fetchNotifications(user.$id, currentBusiness?.$id);
    subscribeToUpdates(user.$id);

    return () => {
      unsubscribeFromUpdates();
    };
  }, [user?.$id, currentBusiness?.$id]);

  const filteredNotifications = (notifications ?? []).filter((n: any) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return n.type === filter;
  });

  const parseData = (value: any): Record<string, any> => {
    if (!value) return {};
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }
    return typeof value === "object" ? value : {};
  };

  const openNotificationTarget = (notification: any) => {
    const data = parseData(notification?.data);
    const invoiceId = data.invoiceId ?? data.invoice_id;
    const productId = data.productId ?? data.product_id;
    const productName = data.productName ?? data.product_name;

    if (invoiceId) {
      router.push({
        pathname: "/(main)/invoices/[id]",
        params: { id: String(invoiceId) },
      });
      return;
    }

    // Products currently has list-level navigation, so open products route.
    if (productId || productName || notification?.type === "low_stock") {
      router.push("/(main)/products" as any);
      return;
    }

    if (
      notification?.type === "payment_received" ||
      notification?.type === "invoice_due"
    ) {
      router.push("/(main)/payments" as any);
      return;
    }
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#0D0F1E", "#131629", "#0D0F1E"]
          : ["#EEF2FF", "#F5F7FA", "#F0F4FF"]
      }
      style={styles.root}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={T.text} />
          </Pressable>
          <Text style={styles.title}>Notification Center</Text>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {[
            ["all", "All"],
            ["unread", "Unread"],
            ["read", "Read"],
            ["invoice_due", "Due"],
            ["low_stock", "Stock"],
          ].map(([value, label]) => (
            <Pressable
              key={value}
              style={[
                styles.filterChip,
                filter === value && styles.filterChipActive,
              ]}
              onPress={() => setFilter(value as Filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === value && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              if (!user?.$id) return;
              markAllAsRead(user.$id);
            }}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={16}
              color={T.primary}
            />
            <Text style={styles.actionText}>Mark all read</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() =>
              user?.$id && fetchNotifications(user.$id, currentBusiness?.$id)
            }
          >
            <Ionicons name="refresh-outline" size={16} color={T.primary} />
            <Text style={styles.actionText}>Refresh</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={T.primary} />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.length === 0 ? (
              <GlassCard dark={isDark}>
                <Text style={styles.emptyText}>
                  No notifications for this filter.
                </Text>
              </GlassCard>
            ) : (
              filteredNotifications.map((notification: any) => (
                <Pressable
                  key={notification.$id}
                  onPress={() => {
                    if (!notification.isRead) markAsRead(notification.$id);
                    openNotificationTarget(notification);
                  }}
                >
                  <GlassCard
                    dark={isDark}
                    style={[
                      styles.notificationCard,
                      !notification.isRead && styles.notificationCardUnread,
                    ]}
                  >
                    <View style={styles.notificationHead}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text style={styles.notificationBody}>
                      {notification.body}
                    </Text>
                    <Text style={styles.notificationMeta}>
                      {new Date(notification.$createdAt).toLocaleString(
                        "en-IN",
                      )}
                    </Text>
                  </GlassCard>
                </Pressable>
              ))
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    title: { ...Typography.h3, color: T.text },
    badgeWrap: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: T.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    filterChip: {
      borderWidth: 1,
      borderColor: T.border,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    filterChipActive: {
      borderColor: T.primary,
      backgroundColor: "rgba(99,102,241,0.15)",
    },
    filterChipText: { color: T.textMuted, fontSize: 12, fontWeight: "600" },
    filterChipTextActive: { color: T.primary },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: T.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    actionText: { color: T.primary, fontSize: 12, fontWeight: "600" },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 30 },
    emptyText: { color: T.textMuted, fontSize: 13, textAlign: "center" },
    notificationCard: { marginBottom: 10 },
    notificationCardUnread: {
      borderColor: "rgba(99,102,241,0.45)",
      borderWidth: 1,
    },
    notificationHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
      gap: 8,
    },
    notificationTitle: {
      flex: 1,
      color: T.text,
      fontSize: 14,
      fontWeight: "700",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: T.primary,
    },
    notificationBody: { color: T.textSecondary, fontSize: 13, lineHeight: 18 },
    notificationMeta: {
      color: T.textMuted,
      fontSize: 11,
      marginTop: 8,
      textAlign: "right",
    },
  });
}
