import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { GlassCard } from "@/src/components/ui/GlassCard";
import {
    ActivityItem,
    listBusinessActivity,
} from "@/src/services/activityService";
import { useBusinessStore } from "@/src/store/businessStore";
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

const TYPE_ICON: Record<ActivityItem["type"], keyof typeof Ionicons.glyphMap> =
  {
    invoice: "receipt-outline",
    staff: "people-outline",
    backup: "cloud-upload-outline",
    notification: "notifications-outline",
  };

export default function ActivityScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { currentBusiness } = useBusinessStore();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<"all" | ActivityItem["type"]>("all");
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>(
    {},
  );

  const load = async () => {
    if (!currentBusiness?.$id) return;
    setLoading(true);
    try {
      const response = await listBusinessActivity(currentBusiness.$id);
      setItems(response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentBusiness?.$id]);

  const filtered = items.filter((item) =>
    filter === "all" ? true : item.type === filter,
  );

  const groupedByDay = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        const key = new Date(item.timestamp).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, ActivityItem[]>,
    );
  }, [filtered]);

  const dayKeys = useMemo(() => Object.keys(groupedByDay), [groupedByDay]);

  const toggleDay = (day: string) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
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
          <Text style={styles.title}>Team Activity Timeline</Text>
          <Pressable onPress={load} hitSlop={8}>
            <Ionicons name="refresh-outline" size={20} color={T.textMuted} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(["all", "invoice", "staff", "backup", "notification"] as const).map(
            (value) => (
              <Pressable
                key={value}
                style={[
                  styles.filterChip,
                  filter === value && styles.filterChipActive,
                ]}
                onPress={() => setFilter(value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === value && styles.filterChipTextActive,
                  ]}
                >
                  {value.toUpperCase()}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={T.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <GlassCard dark={isDark}>
                <Text style={styles.emptyText}>
                  No activity found for this filter.
                </Text>
              </GlassCard>
            ) : (
              dayKeys.map((day) => {
                const isCollapsed = !!collapsedDays[day];
                const entries = groupedByDay[day] ?? [];
                return (
                  <View key={day}>
                    <Pressable
                      style={styles.dayHeader}
                      onPress={() => toggleDay(day)}
                    >
                      <Text style={styles.dayTitle}>{day}</Text>
                      <View style={styles.dayHeaderRight}>
                        <Text style={styles.dayCount}>{entries.length}</Text>
                        <Ionicons
                          name={isCollapsed ? "chevron-down" : "chevron-up"}
                          size={16}
                          color={T.textMuted}
                        />
                      </View>
                    </Pressable>

                    {!isCollapsed &&
                      entries.map((item) => (
                        <GlassCard
                          key={item.id}
                          dark={isDark}
                          style={styles.itemCard}
                        >
                          <View style={styles.itemHead}>
                            <View style={styles.itemIconWrap}>
                              <Ionicons
                                name={TYPE_ICON[item.type]}
                                size={16}
                                color={T.primary}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.itemTitle}>{item.title}</Text>
                              <Text style={styles.itemSub}>
                                {item.subtitle}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.timeText}>
                            {new Date(item.timestamp).toLocaleString("en-IN")}
                          </Text>
                        </GlassCard>
                      ))}
                  </View>
                );
              })
            )}
            <View style={{ height: 70 }} />
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
    filterChipText: { color: T.textMuted, fontSize: 11, fontWeight: "700" },
    filterChipTextActive: { color: T.primary },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
    dayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    dayHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dayTitle: {
      color: T.textMuted,
      fontWeight: "700",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dayCount: {
      color: T.textSecondary,
      fontSize: 11,
      fontWeight: "700",
    },
    itemCard: { marginBottom: 10 },
    itemHead: { flexDirection: "row", alignItems: "center", gap: 10 },
    itemIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: "rgba(99,102,241,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    itemTitle: { color: T.text, fontWeight: "700", fontSize: 14 },
    itemSub: { color: T.textSecondary, fontSize: 12, marginTop: 2 },
    timeText: {
      color: T.textMuted,
      fontSize: 11,
      marginTop: 8,
      textAlign: "right",
    },
    emptyText: { color: T.textMuted, textAlign: "center", fontSize: 13 },
  });
}
