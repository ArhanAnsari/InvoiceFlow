import { Colors, Gradients, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { Avatar } from "@/src/components/ui/Avatar";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { MetricCard } from "@/src/components/ui/MetricCard";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TabSwipeContainer } from "@/src/components/ui/TabSwipeContainer";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { useInvoiceStore } from "@/src/store/invoiceStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCurrency(amount: number, symbol = "\u20b9") {
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(0)}`;
}

function statusToVariant(s: string) {
  if (s === "paid") return "paid";
  if (s === "partial") return "partial";
  if (s === "cancelled") return "cancelled";
  return "unpaid";
}

function getGreetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const [greeting, setGreeting] = useState(() =>
    getGreetingForHour(new Date().getHours()),
  );
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { user } = useAuthStore() as any;
  const { currentBusiness } = useBusinessStore();
  const { invoices, fetchInvoices, isLoading } = useInvoiceStore() as any;

  const reload = useCallback(async () => {
    if (currentBusiness?.$id) {
      await fetchInvoices(currentBusiness.$id);
    }
  }, [currentBusiness]);

  useEffect(() => {
    reload();
  }, [currentBusiness]);

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreetingForHour(new Date().getHours()));
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // KPI calculations
  const totalRevenue = (invoices ?? [])
    .filter((i: any) => i.status === "paid")
    .reduce((s: number, i: any) => s + (i.totalAmount ?? 0), 0);

  const totalPending = (invoices ?? [])
    .filter((i: any) => i.status === "unpaid" || i.status === "partial")
    .reduce((s: number, i: any) => s + (i.balanceDue ?? i.totalAmount ?? 0), 0);

  const totalInvoices = invoices?.length ?? 0;
  const paidCount = (invoices ?? []).filter(
    (i: any) => i.status === "paid",
  ).length;

  const recentInvoices = (invoices ?? []).slice(0, 5);

  if (!currentBusiness) {
    return (
      <TabSwipeContainer currentRoute="/(main)">
        <LinearGradient
          colors={isDark ? ["#0D0F1E", "#131629"] : ["#EEF2FF", "#F5F7FA"]}
          style={styles.root}
        >
          <EmptyState
            icon={
              <Ionicons name="business-outline" size={56} color={T.textMuted} />
            }
            title="No business setup"
            subtitle="Complete your business setup to get started with InvoiceFlow."
            ctaLabel="Set up business"
            onCta={() => router.push("/(auth)/business-setup" as any)}
            dark={isDark}
          />
        </LinearGradient>
      </TabSwipeContainer>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <TabSwipeContainer currentRoute="/(main)">
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
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={reload}
                tintColor={T.primary}
              />
            }
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greeting},</Text>
                <Text style={styles.name}>{firstName}</Text>
              </View>
              <Pressable
                onPress={() => router.push("/(main)/more" as any)}
                hitSlop={8}
              >
                <Avatar name={user?.name} size={44} />
              </Pressable>
            </View>

            {/* Business pill */}
            <Pressable
              onPress={() => router.push("/(auth)/business-setup" as any)}
              hitSlop={8}
            >
              <LinearGradient
                colors={["rgba(99,102,241,0.25)", "rgba(139,92,246,0.15)"]}
                style={styles.businessPill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="business-outline" size={16} color={T.primary} />
                <Text numberOfLines={1} style={styles.businessName}>
                  {currentBusiness.name}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={14}
                  color={T.textMuted}
                />
              </LinearGradient>
            </Pressable>

            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(totalRevenue)}
                subtitle={`${paidCount} invoices paid`}
                gradient={Gradients.primary}
                style={styles.kpiWide}
              />
              <MetricCard
                title="Pending"
                value={formatCurrency(totalPending)}
                subtitle="Outstanding balance"
                dark={isDark}
                style={styles.kpiHalf}
              />
              <MetricCard
                title="Invoices"
                value={String(totalInvoices)}
                subtitle="This month"
                dark={isDark}
                style={styles.kpiHalf}
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              {[
                {
                  icon: "add-circle-outline",
                  label: "New Invoice",
                  onPress: () => router.push("/(main)/invoices/create" as any),
                },
                {
                  icon: "person-add-outline",
                  label: "Add Customer",
                  onPress: () => router.push("/(main)/customers"),
                },
                {
                  icon: "cube-outline",
                  label: "Add Product",
                  onPress: () => router.push("/(main)/products"),
                },
                {
                  icon: "bar-chart-outline",
                  label: "Reports",
                  onPress: () => router.push("/(main)/more" as any),
                },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  style={styles.actionItem}
                  onPress={action.onPress}
                >
                  <LinearGradient
                    colors={["rgba(99,102,241,0.2)", "rgba(139,92,246,0.1)"]}
                    style={styles.actionIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={action.icon as any}
                      size={22}
                      color={T.primary}
                    />
                  </LinearGradient>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Recent Invoices */}
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Invoices</Text>
              <Pressable onPress={() => router.push("/(main)/invoices" as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>

            {recentInvoices.length === 0 ? (
              <GlassCard dark={isDark} style={styles.emptyCard}>
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={T.textMuted}
                  style={{ alignSelf: "center", marginBottom: 8 }}
                />
                <Text style={styles.emptyText}>No invoices yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap + to create your first invoice
                </Text>
              </GlassCard>
            ) : (
              recentInvoices.map((invoice: any) => (
                <Pressable
                  key={invoice.$id}
                  onPress={() =>
                    router.push({
                      pathname: "/(main)/invoices/[id]" as any,
                      params: { id: invoice.$id },
                    })
                  }
                >
                  <GlassCard dark={isDark} style={styles.invoiceRow} noPadding>
                    <View style={styles.invoiceInner}>
                      <Avatar name={invoice.customerName} size={40} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.invoiceCustomer}>
                          {invoice.customerName}
                        </Text>
                        <Text style={styles.invoiceNum}>
                          {invoice.invoiceNumber}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 6 }}>
                        <Text style={styles.invoiceAmount}>
                          {formatCurrency(invoice.totalAmount)}
                        </Text>
                        <StatusBadge status={statusToVariant(invoice.status)} />
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              ))
            )}

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
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    greeting: { fontSize: 14, color: T.textMuted },
    name: { ...Typography.h2, color: T.text },
    businessPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginBottom: Spacing.xl,
    },
    businessName: { fontSize: 13, fontWeight: "600", color: T.text, flex: 1 },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: Spacing.xl,
    },
    kpiWide: { width: "100%" },
    kpiHalf: { flex: 1 },
    sectionTitle: { ...Typography.h4, color: T.text, marginBottom: Spacing.md },
    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xl,
    },
    actionItem: { alignItems: "center", flex: 1 },
    actionIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    actionLabel: {
      fontSize: 11,
      color: T.textSecondary,
      textAlign: "center",
      fontWeight: "500",
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    seeAll: { fontSize: 13, color: T.primary, fontWeight: "600" },
    emptyCard: {
      alignItems: "center",
      paddingVertical: 28,
      marginBottom: Spacing.lg,
    },
    emptyText: { ...Typography.h4, color: T.text, textAlign: "center" },
    emptySubtext: {
      ...Typography.body,
      color: T.textMuted,
      textAlign: "center",
      marginTop: 4,
    },
    invoiceRow: { marginBottom: 8 },
    invoiceInner: { flexDirection: "row", alignItems: "center", padding: 14 },
    invoiceCustomer: { ...Typography.label, color: T.text, fontWeight: "600" },
    invoiceNum: { fontSize: 12, color: T.textMuted, marginTop: 2 },
    invoiceAmount: { ...Typography.label, color: T.text, fontWeight: "700" },
  });
}
