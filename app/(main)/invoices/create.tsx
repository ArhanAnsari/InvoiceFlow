import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { useBusinessStore } from "@/src/store/businessStore";
import { useCustomerStore } from "@/src/store/customerStore";
import { useInvoiceStore } from "@/src/store/invoiceStore";
import { useProductStore } from "@/src/store/productStore";
import { DiscountType } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}

function calcLine(
  qty: number,
  price: number,
  tax: number,
): Pick<LineItem, "taxAmount" | "totalPrice"> {
  const base = qty * price;
  const taxAmount = (base * tax) / 100;
  return { taxAmount, totalPrice: base + taxAmount };
}

export default function CreateInvoiceScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { currentBusiness } = useBusinessStore();
  const { customers } = useCustomerStore() as any;
  const { products } = useProductStore() as any;
  const { createInvoice, isLoading } = useInvoiceStore() as any;

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(
    DiscountType.NONE,
  );
  const [discountValue, setDiscountValue] = useState("0");
  const [lines, setLines] = useState<LineItem[]>([]);

  // Pick customer
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const filteredCustomers = (customers ?? []).filter(
    (c: any) =>
      !customerQuery ||
      c.name.toLowerCase().includes(customerQuery.toLowerCase()),
  );

  const addLine = () => {
    if (!products?.length) {
      Alert.alert("No products", "Please add products first.");
      return;
    }
    const p = products[0];
    const { taxAmount, totalPrice } = calcLine(1, p.price, p.taxRate);
    setLines((prev) => [
      ...prev,
      {
        productId: p.$id,
        productName: p.name,
        quantity: 1,
        price: p.price,
        taxRate: p.taxRate,
        taxAmount,
        totalPrice,
      },
    ]);
  };

  const updateLine = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setLines((prev) => {
      const updated = [...prev];
      const line = {
        ...updated[index],
        [field]: typeof value === "string" ? parseFloat(value) || 0 : value,
      };
      const { taxAmount, totalPrice } = calcLine(
        line.quantity,
        line.price,
        line.taxRate,
      );
      updated[index] = { ...line, taxAmount, totalPrice };
      return updated;
    });
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals
  const subTotal = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  const totalTax = lines.reduce((s, l) => s + l.taxAmount, 0);
  const discAmount =
    discountType === DiscountType.PERCENT
      ? (subTotal * parseFloat(discountValue || "0")) / 100
      : discountType === DiscountType.FLAT
        ? parseFloat(discountValue || "0")
        : 0;
  const totalAmount = subTotal + totalTax - discAmount;

  const handleCreate = async () => {
    if (!customerId) {
      Alert.alert("Required", "Please select a customer.");
      return;
    }
    if (lines.length === 0) {
      Alert.alert("Required", "Add at least one product.");
      return;
    }
    try {
      await createInvoice({
        businessId: currentBusiness?.$id,
        customerId,
        customerName,
        items: lines,
        subTotal,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        discountAmount: discAmount,
        totalTax,
        totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        status: "unpaid",
        notes,
        dueDate: dueDate || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to create invoice");
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={T.text} />
          </Pressable>
          <Text style={styles.title}>New Invoice</Text>
          <View style={{ width: 22 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {/* Customer section */}
            <Text style={styles.sectionLabel}>Customer</Text>
            <GlassCard dark={isDark}>
              <Pressable
                style={styles.customerPicker}
                onPress={() => setShowCustomerPicker((p) => !p)}
              >
                <Ionicons name="person-outline" size={18} color={T.textMuted} />
                <Text
                  style={
                    customerId
                      ? styles.customerName
                      : styles.customerPlaceholder
                  }
                >
                  {customerId ? customerName : "Select a customer"}
                </Text>
                <Ionicons
                  name={showCustomerPicker ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={T.textMuted}
                />
              </Pressable>

              {showCustomerPicker && (
                <>
                  <ThemedInput
                    value={customerQuery}
                    onChangeText={setCustomerQuery}
                    placeholder="Search customers�"
                    containerStyle={{ marginTop: 12, marginBottom: 4 }}
                  />
                  {filteredCustomers.slice(0, 5).map((c: any) => (
                    <Pressable
                      key={c.$id}
                      style={styles.customerOption}
                      onPress={() => {
                        setCustomerId(c.$id);
                        setCustomerName(c.name);
                        setShowCustomerPicker(false);
                        setCustomerQuery("");
                      }}
                    >
                      <Text style={styles.customerOptionText}>{c.name}</Text>
                      {c.phone && (
                        <Text style={styles.customerOptionSub}>{c.phone}</Text>
                      )}
                    </Pressable>
                  ))}
                </>
              )}
            </GlassCard>

            {/* Line Items */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Items</Text>
              <Pressable style={styles.addItemBtn} onPress={addLine}>
                <Ionicons name="add" size={18} color={T.primary} />
                <Text style={styles.addItemText}>Add Item</Text>
              </Pressable>
            </View>

            {lines.length === 0 ? (
              <GlassCard dark={isDark} style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>
                  No items added yet. Tap "Add Item" to begin.
                </Text>
              </GlassCard>
            ) : (
              lines.map((line, idx) => (
                <GlassCard dark={isDark} key={idx} style={styles.lineCard}>
                  <View style={styles.lineHeader}>
                    <Text style={styles.lineTitle} numberOfLines={1}>
                      {line.productName}
                    </Text>
                    <Pressable onPress={() => removeLine(idx)} hitSlop={10}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={T.danger}
                      />
                    </Pressable>
                  </View>
                  <View style={styles.lineRow}>
                    <ThemedInput
                      label="Qty"
                      value={String(line.quantity)}
                      onChangeText={(v) => updateLine(idx, "quantity", v)}
                      keyboardType="decimal-pad"
                      containerStyle={styles.lineField}
                    />
                    <ThemedInput
                      label="Price"
                      value={String(line.price)}
                      onChangeText={(v) => updateLine(idx, "price", v)}
                      keyboardType="decimal-pad"
                      containerStyle={styles.lineField}
                    />
                    <ThemedInput
                      label="Tax %"
                      value={String(line.taxRate)}
                      onChangeText={(v) => updateLine(idx, "taxRate", v)}
                      keyboardType="decimal-pad"
                      containerStyle={styles.lineField}
                    />
                  </View>
                  <Text style={styles.lineTotal}>
                    Total: ?{line.totalPrice.toFixed(2)}
                  </Text>
                </GlassCard>
              ))
            )}

            {/* Discount */}
            <Text style={styles.sectionLabel}>Discount</Text>
            <GlassCard dark={isDark}>
              <View style={styles.discRow}>
                {(
                  [
                    DiscountType.NONE,
                    DiscountType.FLAT,
                    DiscountType.PERCENT,
                  ] as const
                ).map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.discChip,
                      discountType === d && styles.discChipActive,
                    ]}
                    onPress={() => setDiscountType(d)}
                  >
                    <Text
                      style={[
                        styles.discChipText,
                        discountType === d && styles.discChipTextActive,
                      ]}
                    >
                      {d === DiscountType.NONE
                        ? "None"
                        : d === DiscountType.FLAT
                          ? "Flat ?"
                          : "Percent %"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {discountType !== DiscountType.NONE && (
                <ThemedInput
                  label={
                    discountType === DiscountType.FLAT
                      ? "Discount Amount (?)"
                      : "Discount (%)"
                  }
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  keyboardType="decimal-pad"
                  containerStyle={{ marginTop: 12, marginBottom: 0 }}
                />
              )}
            </GlassCard>

            {/* Notes */}
            <Text style={styles.sectionLabel}>Notes & Due Date</Text>
            <GlassCard dark={isDark}>
              <ThemedInput
                label="Due Date"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                containerStyle={{ marginBottom: 8 }}
              />
              <ThemedInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes for the customer�"
                multiline
                numberOfLines={2}
                containerStyle={{ marginBottom: 0 }}
              />
            </GlassCard>

            {/* Summary */}
            <GlassCard dark={isDark} style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>?{subTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>?{totalTax.toFixed(2)}</Text>
              </View>
              {discAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={[styles.summaryValue, { color: T.success }]}>
                    -?{discAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>?{totalAmount.toFixed(2)}</Text>
              </View>
            </GlassCard>

            <PrimaryButton
              label={isLoading ? "Creating�" : "Create Invoice"}
              onPress={handleCreate}
              isLoading={isLoading}
              size="lg"
              style={styles.createBtn}
              dark={isDark}
            />

            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
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
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: Spacing.md,
      marginTop: Spacing.lg,
    },
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    customerPicker: { flexDirection: "row", alignItems: "center", gap: 10 },
    customerName: { flex: 1, fontSize: 15, color: T.text, fontWeight: "500" },
    customerPlaceholder: { flex: 1, fontSize: 15, color: T.placeholder },
    customerOption: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: T.divider,
    },
    customerOptionText: { fontSize: 14, color: T.text, fontWeight: "500" },
    customerOptionSub: { fontSize: 12, color: T.textMuted, marginTop: 2 },
    addItemBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: T.primary,
    },
    addItemText: { fontSize: 13, color: T.primary, fontWeight: "600" },
    emptyItems: { alignItems: "center", paddingVertical: 20 },
    emptyItemsText: { fontSize: 13, color: T.textMuted, textAlign: "center" },
    lineCard: { marginBottom: 8 },
    lineHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    lineTitle: {
      ...Typography.label,
      color: T.text,
      flex: 1,
      fontWeight: "600",
    },
    lineRow: { flexDirection: "row", gap: 8 },
    lineField: { flex: 1, marginBottom: 0 },
    lineTotal: {
      fontSize: 13,
      color: T.primary,
      fontWeight: "700",
      marginTop: 6,
      textAlign: "right",
    },
    discRow: { flexDirection: "row", gap: 8 },
    discChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: T.border,
      alignItems: "center",
    },
    discChipActive: { backgroundColor: T.primary, borderColor: T.primary },
    discChipText: {
      fontSize: 12,
      color: T.textMuted,
      fontWeight: "600",
      textAlign: "center",
    },
    discChipTextActive: { color: "#fff" },
    summary: { marginTop: Spacing.lg, gap: 10 },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: { fontSize: 14, color: T.textSecondary },
    summaryValue: { fontSize: 14, color: T.text, fontWeight: "500" },
    divider: { height: 1, backgroundColor: T.divider },
    totalLabel: { ...Typography.h4, color: T.text },
    totalValue: { ...Typography.h3, color: T.primary, fontWeight: "700" },
    createBtn: { width: "100%", marginTop: Spacing.xl },
  });
}
