import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { useBusinessStore } from "@/src/store/businessStore";
import { useInvoiceStore } from "@/src/store/invoiceStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PaymentMethod = "cash" | "upi" | "card" | "bank" | "other";

export default function PaymentsScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();

  const { currentBusiness } = useBusinessStore();
  const currencySymbol = (currentBusiness as any)?.currencySymbol || "₹";
  const { invoices, recordPayment, isLoading } = useInvoiceStore() as any;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");

  const relevantInvoices = (invoices ?? []).filter(
    (inv: any) =>
      inv.status !== "cancelled" && (inv.balanceDue ?? inv.totalAmount) > 0,
  );

  const history = (invoices ?? [])
    .filter((inv: any) => (inv.paidAmount ?? 0) > 0)
    .sort(
      (a: any, b: any) =>
        new Date(b.paymentDate || b.updatedAt || b.$updatedAt || 0).getTime() -
        new Date(a.paymentDate || a.updatedAt || a.$updatedAt || 0).getTime(),
    );

  const summary = useMemo(() => {
    const totalOutstanding = (invoices ?? []).reduce(
      (sum: number, inv: any) =>
        sum + Number(inv.balanceDue ?? inv.totalAmount ?? 0),
      0,
    );
    const totalCollected = (invoices ?? []).reduce(
      (sum: number, inv: any) => sum + Number(inv.paidAmount ?? 0),
      0,
    );
    const methodBreakdown = (invoices ?? []).reduce(
      (acc: Record<string, number>, inv: any) => {
        const value = Number(inv.paidAmount ?? 0);
        if (value <= 0) return acc;
        const key = inv.paymentMethod || "other";
        acc[key] = (acc[key] || 0) + value;
        return acc;
      },
      {},
    );

    const collectionRate =
      totalCollected + totalOutstanding > 0
        ? (totalCollected / (totalCollected + totalOutstanding)) * 100
        : 0;

    // Extra feature: projected 7-day cashflow assuming 30% of outstanding gets collected.
    const projected7DayInflow = totalCollected + totalOutstanding * 0.3;

    return {
      totalOutstanding,
      totalCollected,
      methodBreakdown,
      collectionRate,
      projected7DayInflow,
    };
  }, [invoices]);

  const selectedInvoice = relevantInvoices.find(
    (inv: any) => inv.$id === selectedInvoiceId,
  );

  const openPaymentModal = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setAmount("");
    setMethod("upi");
    setModalVisible(true);
  };

  const submitPayment = async () => {
    if (!selectedInvoiceId) return;
    const parsed = Number(amount || 0);
    if (parsed <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than 0.");
      return;
    }

    try {
      await recordPayment({
        invoiceId: selectedInvoiceId,
        amount: parsed,
        method,
      });
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert(
        "Payment failed",
        error?.message || "Unable to record payment.",
      );
    }
  };

  const handleExportCsv = async () => {
    try {
      const escapeCell = (value: unknown) => {
        const text = String(value ?? "").replace(/"/g, '""');
        return `"${text}"`;
      };

      const lines = [
        [
          "Invoice Number",
          "Customer",
          "Total Amount",
          "Paid Amount",
          "Balance Due",
          "Status",
          "Payment Method",
          "Payment Date",
        ]
          .map(escapeCell)
          .join(","),
      ];

      for (const inv of history) {
        lines.push(
          [
            inv.invoiceNumber,
            inv.customerName,
            Number(inv.totalAmount ?? 0).toFixed(2),
            Number(inv.paidAmount ?? 0).toFixed(2),
            Number(inv.balanceDue ?? 0).toFixed(2),
            String(inv.status ?? ""),
            String(inv.paymentMethod ?? ""),
            String(inv.paymentDate ?? inv.updatedAt ?? inv.$updatedAt ?? ""),
          ]
            .map(escapeCell)
            .join(","),
        );
      }

      const csv = lines.join("\n");

      await Share.share({
        title: "InvoiceFlow Payments CSV",
        message: csv,
      });
    } catch (error: any) {
      Alert.alert("Export failed", error?.message || "Unable to export CSV.");
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
          <Text style={styles.title}>Payments & Reconciliation</Text>
          <Pressable onPress={handleExportCsv} hitSlop={8}>
            <Ionicons name="download-outline" size={20} color={T.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard dark={isDark} style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Reconciliation Summary</Text>
            <Text style={styles.metric}>
              Collected: {currencySymbol}
              {summary.totalCollected.toLocaleString()}
            </Text>
            <Text style={styles.metric}>
              Outstanding: {currencySymbol}
              {summary.totalOutstanding.toLocaleString()}
            </Text>
            <Text style={styles.metric}>
              Collection rate: {summary.collectionRate.toFixed(1)}%
            </Text>
            <Text style={styles.metric}>
              7-day projected inflow: {currencySymbol}
              {summary.projected7DayInflow.toLocaleString()}
            </Text>
            <View style={styles.methodRow}>
              {Object.entries(summary.methodBreakdown).map(([k, v]) => (
                <View key={k} style={styles.methodChip}>
                  <Text style={styles.methodLabel}>{k.toUpperCase()}</Text>
                  <Text style={styles.methodValue}>
                    {currencySymbol}
                    {Number(v).toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>Pending / Partial Invoices</Text>
          {relevantInvoices.length === 0 ? (
            <GlassCard dark={isDark}>
              <Text style={styles.emptyText}>No outstanding invoices.</Text>
            </GlassCard>
          ) : (
            relevantInvoices.map((inv: any) => (
              <GlassCard key={inv.$id} dark={isDark} style={styles.invoiceCard}>
                <View style={styles.invoiceHead}>
                  <Text style={styles.invoiceNo}>{inv.invoiceNumber}</Text>
                  <Text style={styles.badge}>
                    {String(inv.status).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.invoiceMeta}>{inv.customerName}</Text>
                <Text style={styles.invoiceMeta}>
                  Due: {currencySymbol}
                  {Number(
                    inv.balanceDue ?? inv.totalAmount ?? 0,
                  ).toLocaleString()}
                </Text>
                <PrimaryButton
                  label="Record Payment"
                  onPress={() => openPaymentModal(inv.$id)}
                  size="sm"
                  style={{ width: "100%", marginTop: 8 }}
                  dark={isDark}
                />
              </GlassCard>
            ))
          )}

          <Text style={styles.sectionTitle}>
            Payment History (Partial / Settled)
          </Text>
          {history.length === 0 ? (
            <GlassCard dark={isDark}>
              <Text style={styles.emptyText}>No payment history yet.</Text>
            </GlassCard>
          ) : (
            history.map((inv: any) => (
              <GlassCard
                key={`h_${inv.$id}`}
                dark={isDark}
                style={styles.historyCard}
              >
                <View style={styles.invoiceHead}>
                  <Text style={styles.invoiceNo}>{inv.invoiceNumber}</Text>
                  <Text style={styles.badge}>
                    {String(inv.status).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.invoiceMeta}>
                  Method: {String(inv.paymentMethod || "other").toUpperCase()}
                </Text>
                <Text style={styles.invoiceMeta}>
                  Paid: {currencySymbol}
                  {Number(inv.paidAmount ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.invoiceMeta}>
                  Balance: {currencySymbol}
                  {Number(inv.balanceDue ?? 0).toLocaleString()}
                </Text>
              </GlassCard>
            ))
          )}

          <View style={{ height: 70 }} />
        </ScrollView>

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard dark={isDark} style={styles.modalCard}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <Text style={styles.invoiceMeta}>
                Invoice: {selectedInvoice?.invoiceNumber || "-"}
              </Text>
              <Text style={styles.invoiceMeta}>
                Due amount: {currencySymbol}
                {Number(
                  selectedInvoice?.balanceDue ??
                    selectedInvoice?.totalAmount ??
                    0,
                ).toLocaleString()}
              </Text>

              <ThemedInput
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />

              <View style={styles.methodSelector}>
                {(
                  ["upi", "cash", "card", "bank", "other"] as PaymentMethod[]
                ).map((m) => (
                  <Pressable
                    key={m}
                    style={[
                      styles.methodChip,
                      method === m && styles.methodChipActive,
                    ]}
                    onPress={() => setMethod(m)}
                  >
                    <Text
                      style={[
                        styles.methodLabel,
                        method === m && styles.methodLabelActive,
                      ]}
                    >
                      {m.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <PrimaryButton
                label={isLoading ? "Saving..." : "Save Payment"}
                onPress={submitPayment}
                isLoading={isLoading}
                size="md"
                style={{ width: "100%", marginTop: 8 }}
                dark={isDark}
              />
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </GlassCard>
          </View>
        </Modal>
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
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: Spacing.md,
      marginTop: Spacing.md,
    },
    summaryCard: { marginBottom: 10 },
    metric: { color: T.text, fontSize: 14, marginBottom: 4, fontWeight: "600" },
    methodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    methodChip: {
      borderWidth: 1,
      borderColor: T.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: T.surface,
    },
    methodChipActive: {
      borderColor: T.primary,
      backgroundColor: "rgba(99,102,241,0.15)",
    },
    methodLabel: { color: T.textMuted, fontSize: 11, fontWeight: "700" },
    methodLabelActive: { color: T.primary },
    methodValue: {
      color: T.text,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    invoiceCard: { marginBottom: 10 },
    historyCard: { marginBottom: 10 },
    invoiceHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    invoiceNo: { color: T.text, fontSize: 14, fontWeight: "700" },
    badge: {
      fontSize: 10,
      color: T.primary,
      fontWeight: "700",
      backgroundColor: "rgba(99,102,241,0.12)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    invoiceMeta: { color: T.textSecondary, fontSize: 13, marginBottom: 2 },
    emptyText: { color: T.textMuted, fontSize: 13, textAlign: "center" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
      padding: 12,
    },
    modalCard: {},
    modalTitle: { ...Typography.h4, color: T.text, marginBottom: 8 },
    methodSelector: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    cancelBtn: { alignItems: "center", paddingVertical: 8, marginTop: 6 },
    cancelText: { color: T.textMuted, fontWeight: "600" },
  });
}
