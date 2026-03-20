import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { Avatar } from "@/src/components/ui/Avatar";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { TabSwipeContainer } from "@/src/components/ui/TabSwipeContainer";
import { listBackups, triggerBackup } from "@/src/services/backupService";
import {
    runAnalyticsCalculator,
    runCleanupOldData,
} from "@/src/services/functionsService";
import {
    listNotificationsForUser,
    markNotificationRead,
} from "@/src/services/notificationService";
import { subscribeToNotifications } from "@/src/services/realtimeService";
import {
    listMonthlyReports,
    triggerMonthlyReportGeneration,
} from "@/src/services/reportsService";
import { getStaffRoles } from "@/src/services/staffService";
import {
    getSubscriptionByBusinessId,
    validateAndSyncSubscription,
} from "@/src/services/subscriptionService";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { useUIStore } from "@/src/store/uiStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, subtitle, onPress, danger }: MenuItemProps) {
  const T = useTheme();
  const styles = useMemo(() => createStyles(T), [T]);
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={[styles.itemIcon, danger && styles.itemIconDanger]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? T.danger : T.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, danger && { color: T.danger }]}>
          {label}
        </Text>
        {subtitle ? <Text style={styles.itemSub}>{subtitle}</Text> : null}
      </View>
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color={T.textMuted} />
      )}
    </Pressable>
  );
}

export default function MoreScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { user, logout } = useAuthStore() as any;
  const { currentBusiness } = useBusinessStore();
  const { themeMode, setThemeMode } = useUIStore();
  const [isWorking, setIsWorking] = useState(false);
  const [stats, setStats] = useState({
    staffCount: 0,
    backupCount: 0,
    unreadNotifications: 0,
    latestReportMonth: "No reports",
    subscriptionSummary: "Not available",
  });

  const toggleTheme = () => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  };

  const loadStats = useCallback(async () => {
    if (!currentBusiness?.$id || !user?.$id) return;

    try {
      const [
        staffResp,
        backupsResp,
        notificationsResp,
        reportsResp,
        subscription,
      ] = await Promise.all([
        getStaffRoles(currentBusiness.$id),
        listBackups(currentBusiness.$id),
        listNotificationsForUser(user.$id, currentBusiness.$id),
        listMonthlyReports(currentBusiness.$id, 1),
        getSubscriptionByBusinessId(currentBusiness.$id),
      ]);

      const unreadNotifications = notificationsResp.documents.filter(
        (doc: any) => !doc.isRead,
      ).length;

      const latestReportMonth = reportsResp.documents[0]?.month ?? "No reports";

      const subscriptionSummary = subscription
        ? `${String(subscription.planType || "free").toUpperCase()} • ${String(subscription.status || "unknown")}`
        : "No active subscription";

      setStats({
        staffCount: staffResp.total,
        backupCount: backupsResp.total,
        unreadNotifications,
        latestReportMonth,
        subscriptionSummary,
      });
    } catch (error: any) {
      console.error("Failed to load More screen stats", error);
    }
  }, [currentBusiness?.$id, user?.$id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!user?.$id) return;

    const unsubscribe = subscribeToNotifications(user.$id, () => {
      loadStats();
    });

    return () => unsubscribe();
  }, [user?.$id, loadStats]);

  const handleStaffRoles = async () => {
    if (!currentBusiness?.$id) return;

    try {
      setIsWorking(true);
      const response = await getStaffRoles(currentBusiness.$id);
      Alert.alert(
        "Staff & Roles",
        response.total > 0
          ? `${response.total} active staff member(s) found.`
          : "No active staff found for this business.",
      );
    } catch (error: any) {
      Alert.alert("Staff & Roles", error?.message ?? "Unable to fetch staff.");
    } finally {
      setIsWorking(false);
      loadStats();
    }
  };

  const handleUpgradePlan = async () => {
    if (!currentBusiness?.$id) return;

    const syncTrialSubscription = async () => {
      if (!user?.$id || !currentBusiness?.$id) return;

      try {
        setIsWorking(true);
        await validateAndSyncSubscription({
          userId: user.$id,
          businessId: currentBusiness.$id,
          platform: "web",
          productId: "invoiceflow_trial",
          receipt: `trial_${Date.now()}`,
        });
        Alert.alert("Subscription", "Trial subscription synced successfully.");
      } catch (error: any) {
        Alert.alert(
          "Subscription",
          error?.message ?? "Failed to sync trial subscription.",
        );
      } finally {
        setIsWorking(false);
        loadStats();
      }
    };

    try {
      setIsWorking(true);
      const subscription = await getSubscriptionByBusinessId(
        currentBusiness.$id,
      );

      if (!subscription) {
        Alert.alert("Subscription", "No active subscription found.", [
          {
            text: "Sync Trial",
            onPress: () => {
              void syncTrialSubscription();
            },
          },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      Alert.alert(
        "Subscription",
        `Plan: ${String(subscription.planType || "free").toUpperCase()}\nStatus: ${subscription.status}\nEnds: ${subscription.endDate || "N/A"}`,
      );
    } catch (error: any) {
      Alert.alert(
        "Subscription",
        error?.message ?? "Unable to fetch subscription.",
      );
    } finally {
      setIsWorking(false);
      loadStats();
    }
  };

  const handleSalesReport = async () => {
    if (!currentBusiness?.$id) return;

    try {
      setIsWorking(true);
      const { data } = await runAnalyticsCalculator(currentBusiness.$id);
      const analytics = (data as any)?.analytics;

      if (!analytics) {
        Alert.alert(
          "Sales Report",
          "Analytics requested. Please try again in a few seconds.",
        );
        return;
      }

      Alert.alert(
        "Sales Report",
        `Invoices: ${analytics.invoiceCount || 0}\nRevenue: ${Number(analytics.totalRevenue || 0).toFixed(2)}\nTop Customers: ${(analytics.topCustomers || []).length}\nTop Products: ${(analytics.topProducts || []).length}`,
      );
    } catch (error: any) {
      Alert.alert("Sales Report", error?.message ?? "Failed to run analytics.");
    } finally {
      setIsWorking(false);
      loadStats();
    }
  };

  const handleGenerateMonthlyReport = async () => {
    try {
      setIsWorking(true);
      const { data } = await triggerMonthlyReportGeneration();
      Alert.alert(
        "Monthly Reports",
        `Generation completed. Reports created: ${Number((data as any)?.reportsCreated || 0)}`,
      );
    } catch (error: any) {
      Alert.alert(
        "Monthly Reports",
        error?.message ?? "Failed to generate monthly reports.",
      );
    } finally {
      setIsWorking(false);
      loadStats();
    }
  };

  const handleBackup = async () => {
    if (!currentBusiness?.$id || !user?.$id) return;

    try {
      setIsWorking(true);
      const result = await triggerBackup(currentBusiness.$id, user.$id);
      const backupId = (result.data as any)?.backupId || "N/A";
      const fileName = (result.data as any)?.fileName || "N/A";
      Alert.alert(
        "Backup Created",
        `Backup ID: ${backupId}\nFile: ${fileName}`,
      );
    } catch (error: any) {
      Alert.alert("Backup", error?.message ?? "Failed to create backup.");
    } finally {
      setIsWorking(false);
      loadStats();
    }
  };

  const handleCleanup = async () => {
    try {
      setIsWorking(true);
      const { data } = await runCleanupOldData();
      const deleted = (data as any)?.deleted;
      Alert.alert(
        "Cleanup Completed",
        deleted
          ? `Backups: ${deleted.backups || 0}\nBackup files: ${deleted.backupFiles || 0}\nNotifications: ${deleted.notifications || 0}`
          : "Cleanup function executed successfully.",
      );
    } catch (error: any) {
      Alert.alert("Cleanup", error?.message ?? "Cleanup failed.");
    } finally {
      setIsWorking(false);
      loadStats();
    }
  };

  const handleNotifications = async () => {
    if (!user?.$id) return;

    try {
      setIsWorking(true);
      const response = await listNotificationsForUser(
        user.$id,
        currentBusiness?.$id,
      );

      const unread = response.documents.filter((doc: any) => !doc.isRead);
      if (unread.length > 0) {
        await Promise.all(
          unread.slice(0, 20).map((doc: any) => markNotificationRead(doc.$id)),
        );
      }

      Alert.alert(
        "Notifications",
        unread.length > 0
          ? `${unread.length} notification(s) marked as read.`
          : "No unread notifications.",
      );
    } catch (error: any) {
      Alert.alert(
        "Notifications",
        error?.message ?? "Failed to fetch notifications.",
      );
    } finally {
      setIsWorking(false);
      loadStats();
    }
  };

  return (
    <TabSwipeContainer currentRoute="/(main)/more">
      <LinearGradient
        colors={
          isDark
            ? ["#0D0F1E", "#131629", "#0D0F1E"]
            : ["#EEF2FF", "#F5F7FA", "#F0F4FF"]
        }
        style={styles.root}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {/* Profile section */}
            <GlassCard dark={isDark} style={styles.profileCard}>
              <Avatar name={user?.name} size={60} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.profileName}>{user?.name ?? "User"}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                {currentBusiness && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planText}>
                      {(currentBusiness.planType ?? "free").toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </GlassCard>

            {/* Business */}
            <Text style={styles.sectionLabel}>Business</Text>
            <GlassCard dark={isDark} noPadding style={styles.group}>
              <MenuItem
                icon="business-outline"
                label="Business Profile"
                subtitle={currentBusiness?.name}
                onPress={() => router.push("/(auth)/business-setup" as any)}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="people-outline"
                label="Staff & Roles"
                subtitle={`${stats.staffCount} active members`}
                onPress={handleStaffRoles}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="star-outline"
                label="Upgrade Plan"
                subtitle={stats.subscriptionSummary}
                onPress={handleUpgradePlan}
              />
            </GlassCard>

            {/* Reports */}
            <Text style={styles.sectionLabel}>Reports & Data</Text>
            <GlassCard dark={isDark} noPadding style={styles.group}>
              <MenuItem
                icon="bar-chart-outline"
                label="Sales Report"
                subtitle={`Latest month: ${stats.latestReportMonth}`}
                onPress={handleSalesReport}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="download-outline"
                label="Generate Monthly Report"
                subtitle="Run report generation function"
                onPress={handleGenerateMonthlyReport}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="cloud-upload-outline"
                label="Backup"
                subtitle={`${stats.backupCount} backup(s) available`}
                onPress={handleBackup}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="trash-outline"
                label="Cleanup Old Data"
                subtitle="Run weekly cleanup now"
                onPress={handleCleanup}
              />
            </GlassCard>

            {/* Settings */}
            <Text style={styles.sectionLabel}>Settings</Text>
            <GlassCard dark={isDark} noPadding style={styles.group}>
              <MenuItem
                icon={themeMode === "dark" ? "sunny-outline" : "moon-outline"}
                label={
                  themeMode === "dark" ? "Switch to Light" : "Switch to Dark"
                }
                onPress={toggleTheme}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="notifications-outline"
                label="Notifications"
                subtitle={`${stats.unreadNotifications} unread`}
                onPress={handleNotifications}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="help-circle-outline"
                label="Help & Support"
                subtitle={
                  isWorking ? "Please wait..." : "Contact support anytime"
                }
                onPress={() =>
                  Alert.alert(
                    "Help & Support",
                    "Reach out to support@invoiceflow.app for account and billing help.",
                  )
                }
              />
            </GlassCard>

            {/* Logout */}
            <GlassCard
              dark={isDark}
              noPadding
              style={[styles.group, { marginTop: 8 }]}
            >
              <MenuItem
                icon="log-out-outline"
                label="Sign Out"
                onPress={logout}
                danger
              />
            </GlassCard>

            <Text style={styles.version}>InvoiceFlow v2.0.0</Text>
            <View style={{ height: Platform.OS === "ios" ? 100 : 80 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </TabSwipeContainer>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    profileName: { ...Typography.h3, color: T.text },
    profileEmail: { fontSize: 13, color: T.textMuted, marginTop: 2 },
    planBadge: {
      backgroundColor: "rgba(99,102,241,0.2)",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: "flex-start",
      marginTop: 6,
    },
    planText: {
      fontSize: 10,
      color: T.primary,
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: Spacing.md,
      marginLeft: 4,
    },
    group: { padding: 0, marginBottom: Spacing.xl, overflow: "hidden" },
    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    itemIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "rgba(99,102,241,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    itemIconDanger: { backgroundColor: "rgba(239,68,68,0.12)" },
    itemLabel: { fontSize: 15, color: T.text, fontWeight: "500" },
    itemSub: { fontSize: 12, color: T.textMuted, marginTop: 2 },
    divider: { height: 1, backgroundColor: T.divider, marginLeft: 64 },
    version: {
      fontSize: 12,
      color: T.textMuted,
      textAlign: "center",
      marginVertical: Spacing.xl,
    },
  });
}
