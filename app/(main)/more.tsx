import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { Avatar } from "@/src/components/ui/Avatar";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { TabSwipeContainer } from "@/src/components/ui/TabSwipeContainer";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { useUIStore } from "@/src/store/uiStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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

  const toggleTheme = () => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  };

  const showComingSoon = (feature: string) => {
    Alert.alert(feature, "This feature is coming soon.");
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
                subtitle="Manage team members"
                onPress={() => showComingSoon("Staff & Roles")}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="star-outline"
                label="Upgrade Plan"
                subtitle="Get Pro or Enterprise"
                onPress={() => showComingSoon("Upgrade Plan")}
              />
            </GlassCard>

            {/* Reports */}
            <Text style={styles.sectionLabel}>Reports & Data</Text>
            <GlassCard dark={isDark} noPadding style={styles.group}>
              <MenuItem
                icon="bar-chart-outline"
                label="Sales Report"
                onPress={() => router.push("/(main)/invoices" as any)}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="download-outline"
                label="Export Data"
                subtitle="Export invoices as CSV / PDF"
                onPress={() => showComingSoon("Export Data")}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="cloud-upload-outline"
                label="Backup"
                subtitle="Backup to cloud"
                onPress={() => showComingSoon("Backup")}
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
                onPress={() => showComingSoon("Notifications")}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="help-circle-outline"
                label="Help & Support"
                onPress={() => showComingSoon("Help & Support")}
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
