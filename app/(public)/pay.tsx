import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { getPublicInvoiceByToken } from "@/src/services/functionsService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PublicPaymentPage() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("Missing payment token");
        setLoading(false);
        return;
      }

      try {
        const { data } = await getPublicInvoiceByToken(String(token));
        if (!data?.ok || !data?.invoice) {
          setError(data?.error || "Invoice not available");
        } else {
          setInvoice(data.invoice);
          setBusiness(data.business);
        }
      } catch (err: any) {
        setError(err?.message || "Unable to fetch invoice");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handlePay = async () => {
    if (!invoice) return;

    const upiId = invoice?.upiId;
    if (!upiId) {
      Alert.alert("UPI unavailable", "Merchant UPI is not configured.");
      return;
    }

    const amount = Number(
      invoice.balanceDue ?? invoice.totalAmount ?? 0,
    ).toFixed(2);
    const link = `upi://pay?pa=${encodeURIComponent(String(upiId))}&pn=${encodeURIComponent(String(invoice.businessName || "InvoiceFlow"))}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;

    const canOpen = await Linking.canOpenURL(link);
    if (!canOpen) {
      Alert.alert("UPI app not found", "Install a UPI app to continue.");
      return;
    }

    await Linking.openURL(link);
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
      <SafeAreaView style={styles.root}>
        <View style={styles.container}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={T.primary} />
            </View>
          ) : error ? (
            <GlassCard dark={isDark}>
              <Text style={styles.errorTitle}>Payment Link Invalid</Text>
              <Text style={styles.errorBody}>{error}</Text>
            </GlassCard>
          ) : (
            <GlassCard dark={isDark} style={styles.card}>
              <View style={styles.header}>
                <Ionicons name="receipt-outline" size={22} color={T.primary} />
                <Text style={styles.title}>Invoice Payment</Text>
              </View>

              <Text style={styles.businessName}>
                {business?.name || invoice?.businessName}
              </Text>
              <Text style={styles.meta}>Invoice: {invoice?.invoiceNumber}</Text>
              <Text style={styles.meta}>Customer: {invoice?.customerName}</Text>

              <View style={styles.amountWrap}>
                <Text style={styles.amountLabel}>Amount Due</Text>
                <Text style={styles.amountValue}>
                  {business?.currencySymbol || "₹"}
                  {Number(invoice?.balanceDue ?? 0).toLocaleString()}
                </Text>
              </View>

              <Pressable style={styles.payButton} onPress={handlePay}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.payButtonText}>Pay Now via UPI</Text>
              </Pressable>

              <Text style={styles.helperText}>
                Secure payment link generated for this invoice.
              </Text>
            </GlassCard>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing.xl,
    },
    centered: { alignItems: "center", justifyContent: "center" },
    card: { gap: 8 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    title: { ...Typography.h3, color: T.text },
    businessName: { ...Typography.h4, color: T.text, marginTop: 4 },
    meta: { color: T.textSecondary, fontSize: 13 },
    amountWrap: {
      marginTop: 12,
      marginBottom: 8,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: T.border,
    },
    amountLabel: {
      fontSize: 12,
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    amountValue: { ...Typography.h2, color: T.primary },
    payButton: {
      marginTop: 6,
      backgroundColor: T.primary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    payButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    helperText: {
      marginTop: 8,
      color: T.textMuted,
      fontSize: 12,
      textAlign: "center",
    },
    errorTitle: { ...Typography.h4, color: T.danger, marginBottom: 6 },
    errorBody: { color: T.textSecondary, fontSize: 13 },
  });
}
