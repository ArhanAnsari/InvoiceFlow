import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { Avatar } from "@/src/components/ui/Avatar";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { useBusinessStore } from "@/src/store/businessStore";
import { useInvoiceStore } from "@/src/store/invoiceStore";
import { StatusVariant } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const FILTERS = ["All", "Unpaid", "Paid", "Partial"] as const;
type Filter = (typeof FILTERS)[number];

function statusVariant(s: string): StatusVariant {
  if (s === "paid") return "paid";
  if (s === "partial") return "partial";
  if (s === "cancelled") return "cancelled";
  return "unpaid";
}

export default function InvoicesScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { invoices, fetchInvoices, isLoading } = useInvoiceStore() as any;
  const { currentBusiness } = useBusinessStore();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const load = useCallback(() => {
    if (currentBusiness?.$id) fetchInvoices(currentBusiness.$id);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [currentBusiness]);

  const filtered = (invoices ?? []).filter((inv: any) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Unpaid" && inv.status === "unpaid") ||
      (filter === "Paid" && inv.status === "paid") ||
      (filter === "Partial" && inv.status === "partial");
    const matchQuery =
      !query ||
      inv.customerName?.toLowerCase().includes(query.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

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
          <View>
            <Text style={styles.title}>Invoices</Text>
            <Text style={styles.subtitle}>{filtered.length} records</Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/(main)/invoices/create")}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or number�"
            dark={isDark}
          />
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[styles.chipText, filter === f && styles.chipTextActive]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            icon={
              <Ionicons name="receipt-outline" size={56} color={T.textMuted} />
            }
            title="No invoices found"
            subtitle={
              query || filter !== "All"
                ? "Try adjusting your filters."
                : "Create your first invoice by tapping +."
            }
            dark={isDark}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={load}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: "/(main)/invoices/[id]", params: { id: item.$id } })}
              >
                <GlassCard dark={isDark} noPadding style={styles.card}>
                  <View style={styles.row}>
                    <Avatar name={item.customerName} size={44} />
                    <View style={styles.info}>
                      <Text style={styles.customer}>{item.customerName}</Text>
                      <Text style={styles.invoiceNum}>
                        {item.invoiceNumber}
                      </Text>
                      <Text style={styles.date}>
                        {new Date(
                          item.invoiceDate ?? item.$createdAt,
                        ).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                    <View style={styles.right}>
                      <Text style={styles.amount}>
                        ?{parseFloat(item.totalAmount).toLocaleString()}
                      </Text>
                      <StatusBadge status={statusVariant(item.status)} />
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            )}
          />
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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    title: { ...Typography.h2, color: T.text },
    subtitle: { fontSize: 13, color: T.textMuted, marginTop: 2 },
    addBtn: {
      width: 44,
      height: 44,
      backgroundColor: T.primary,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    searchWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: T.border,
    },
    chipActive: { backgroundColor: T.primary, borderColor: T.primary },
    chipText: { fontSize: 12, color: T.textMuted, fontWeight: "600" },
    chipTextActive: { color: "#fff" },
    list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
    card: { marginBottom: 8 },
    row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
    info: { flex: 1 },
    customer: { ...Typography.label, color: T.text, fontWeight: "600" },
    invoiceNum: { fontSize: 12, color: T.textMuted, marginTop: 2 },
    date: { fontSize: 11, color: T.textMuted, marginTop: 1 },
    right: { alignItems: "flex-end", gap: 6 },
    amount: { fontSize: 15, fontWeight: "700", color: T.text },
  });
}
