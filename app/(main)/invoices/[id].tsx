import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { Avatar } from "@/src/components/ui/Avatar";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { listInvoiceItemsByInvoice } from "@/src/services/invoiceItemsService";
import { useInvoiceStore } from "@/src/store/invoiceStore";
import { StatusVariant } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function statusVariant(s: string): StatusVariant {
  if (s === "paid") return "paid";
  if (s === "partial") return "partial";
  if (s === "cancelled") return "cancelled";
  return "unpaid";
}

export default function InvoiceDetailScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices } = useInvoiceStore() as any;
  const [lineItems, setLineItems] = useState<any[]>([]);

  const invoice = (invoices ?? []).find((inv: any) => inv.$id === id);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const loadInvoiceItems = async () => {
      try {
        const response = await listInvoiceItemsByInvoice(id);
        if (!isMounted) return;

        if (response.documents.length > 0) {
          setLineItems(response.documents as any[]);
        }
      } catch (error) {
        // Non-blocking fallback to embedded invoice items.
        if (isMounted) setLineItems([]);
      }
    };

    loadInvoiceItems();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!invoice) {
    return (
      <LinearGradient
        colors={isDark ? ["#0D0F1E", "#131629"] : ["#EEF2FF", "#F5F7FA"]}
        style={styles.root}
      >
        <SafeAreaView style={styles.centered}>
          <Ionicons name="receipt-outline" size={56} color={T.textMuted} />
          <Text style={styles.notFoundText}>Invoice not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backPill}>
            <Text style={styles.backPillText}>Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const items: any[] = lineItems.length > 0 ? lineItems : (invoice.items ?? []);
  const subTotal: number = invoice.subTotal ?? 0;
  const totalTax: number = invoice.totalTax ?? 0;
  const discountAmount: number = invoice.discountAmount ?? 0;
  const totalAmount: number = invoice.totalAmount ?? 0;
  const paidAmount: number = invoice.paidAmount ?? 0;
  const balanceDue: number = invoice.balanceDue ?? totalAmount - paidAmount;

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={T.text} />
          </Pressable>
          <Text style={styles.title}>Invoice</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Customer Card */}
          <GlassCard dark={isDark} style={styles.customerCard}>
            <View style={styles.customerRow}>
              <Avatar name={invoice.customerName} size={48} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.customerName}>{invoice.customerName}</Text>
                <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
              </View>
              <StatusBadge status={statusVariant(invoice.status)} />
            </View>
            {invoice.invoiceDate && (
              <Text style={styles.date}>
                Date:{" "}
                {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
              </Text>
            )}
            {invoice.dueDate && (
              <Text style={styles.date}>
                Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
              </Text>
            )}
          </GlassCard>

          {/* Line Items */}
          {items.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Items</Text>
              <GlassCard dark={isDark} noPadding>
                {items.map((item: any, idx: number) => (
                  <View key={idx}>
                    <View style={styles.lineRow}>
                      <Text style={styles.lineProduct} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.lineQty}>
                        {item.quantity} × ₹
                        {parseFloat(item.price).toLocaleString()}
                      </Text>
                      <Text style={styles.lineTotal}>
                        ₹{parseFloat(item.totalPrice).toLocaleString()}
                      </Text>
                    </View>
                    {idx < items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </GlassCard>
            </>
          )}

          {/* Summary */}
          <Text style={styles.sectionLabel}>Summary</Text>
          <GlassCard dark={isDark} style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₹{subTotal.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                ₹{totalTax.toLocaleString()}
              </Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: T.success }]}>
                  -₹{discountAmount.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{totalAmount.toLocaleString()}
              </Text>
            </View>
            {paidAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={[styles.summaryValue, { color: T.success }]}>
                  ₹{paidAmount.toLocaleString()}
                </Text>
              </View>
            )}
            {balanceDue > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: T.danger }]}>
                  Balance Due
                </Text>
                <Text style={[styles.totalValue, { color: T.danger }]}>
                  ₹{balanceDue.toLocaleString()}
                </Text>
              </View>
            )}
          </GlassCard>

          {invoice.notes ? (
            <>
              <Text style={styles.sectionLabel}>Notes</Text>
              <GlassCard dark={isDark}>
                <Text style={styles.notes}>{invoice.notes}</Text>
              </GlassCard>
            </>
          ) : null}

          <View style={{ height: Platform.OS === "ios" ? 100 : 80 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    notFoundText: { ...Typography.h3, color: T.textMuted },
    backPill: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: Radius.full,
      borderWidth: 1.5,
      borderColor: T.primary,
    },
    backPillText: { color: T.primary, fontWeight: "700" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    title: { ...Typography.h3, color: T.text },
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
    customerCard: { marginBottom: Spacing.lg },
    customerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    customerName: { ...Typography.h4, color: T.text },
    invoiceNum: { fontSize: 13, color: T.textMuted, marginTop: 2 },
    date: { fontSize: 13, color: T.textSecondary, marginTop: 2 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: Spacing.md,
      marginTop: Spacing.md,
    },
    lineRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
    },
    lineProduct: { flex: 1, fontSize: 14, color: T.text, fontWeight: "500" },
    lineQty: { fontSize: 12, color: T.textMuted },
    lineTotal: {
      fontSize: 14,
      color: T.text,
      fontWeight: "700",
      minWidth: 70,
      textAlign: "right",
    },
    divider: { height: 1, backgroundColor: T.divider, marginHorizontal: 14 },
    summary: { gap: 10 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between" },
    summaryLabel: { fontSize: 14, color: T.textSecondary },
    summaryValue: { fontSize: 14, color: T.text, fontWeight: "500" },
    totalLabel: { ...Typography.h4, color: T.text },
    totalValue: { ...Typography.h3, color: T.primary, fontWeight: "700" },
    notes: { fontSize: 14, color: T.textSecondary, lineHeight: 22 },
  });
}
