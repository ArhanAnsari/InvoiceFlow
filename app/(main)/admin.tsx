import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import {
    runReminderAutomation,
    verifyPaymentWebhook,
} from "@/src/services/functionsService";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Provider = "razorpay" | "phonepe" | "paytm";

export default function AdminToolsScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();

  const { user } = useAuthStore() as any;
  const { currentBusiness } = useBusinessStore();

  const [provider, setProvider] = useState<Provider>("razorpay");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [signature, setSignature] = useState("");
  const [result, setResult] = useState<string>("");
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);

  const adminEmail = String(process.env.EXPO_PUBLIC_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const userEmail = String(user?.email || "")
    .trim()
    .toLowerCase();
  const isAdmin =
    (!!adminEmail && userEmail === adminEmail) ||
    (!!user?.$id &&
      !!currentBusiness?.ownerId &&
      user.$id === currentBusiness.ownerId);

  const runWebhookTest = async () => {
    setLoadingWebhook(true);
    setResult("");

    try {
      const numeric = Number(amount || 0);
      const payload: Record<string, any> = {
        invoiceId,
        notes: { invoiceId },
      };

      if (provider === "razorpay" || provider === "phonepe") {
        payload.amount = Math.round(numeric * 100);
      } else {
        payload.txnAmount = numeric;
      }

      const { data } = await verifyPaymentWebhook({
        provider,
        payload,
        signature: signature.trim() || undefined,
      });

      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(error?.message || "Webhook verification failed");
    } finally {
      setLoadingWebhook(false);
    }
  };

  const runRemindersTest = async () => {
    setLoadingReminders(true);
    setResult("");

    try {
      const { data } = await runReminderAutomation({
        businessId: currentBusiness?.$id,
        channels: ["in_app", "email", "sms"],
      });
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(error?.message || "Reminder automation failed");
    } finally {
      setLoadingReminders(false);
    }
  };

  if (!isAdmin) {
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
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={T.text} />
            </Pressable>
            <Text style={styles.title}>Admin Tools</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.centerWrap}>
            <GlassCard dark={isDark}>
              <Text style={styles.lockTitle}>Access Restricted</Text>
              <Text style={styles.lockBody}>
                This screen is available only for the configured admin account.
              </Text>
            </GlassCard>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={T.text} />
          </Pressable>
          <Text style={styles.title}>Admin Tools</Text>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={T.success}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard dark={isDark} style={styles.card}>
            <Text style={styles.sectionTitle}>Webhook Verification Test</Text>
            <View style={styles.providerRow}>
              {(["razorpay", "phonepe", "paytm"] as Provider[]).map((p) => (
                <Pressable
                  key={p}
                  style={[
                    styles.providerChip,
                    provider === p && styles.providerChipActive,
                  ]}
                  onPress={() => setProvider(p)}
                >
                  <Text
                    style={[
                      styles.providerChipText,
                      provider === p && styles.providerChipTextActive,
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ThemedInput
              dark={isDark}
              label="Invoice ID"
              value={invoiceId}
              onChangeText={setInvoiceId}
              placeholder="Paste invoice document ID"
            />
            <ThemedInput
              dark={isDark}
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="e.g. 2599"
            />
            <ThemedInput
              dark={isDark}
              label="Signature (optional for test env)"
              value={signature}
              onChangeText={setSignature}
              placeholder="provider webhook signature"
            />

            <PrimaryButton
              label={loadingWebhook ? "Running..." : "Run Webhook Verify"}
              onPress={runWebhookTest}
              isLoading={loadingWebhook}
              size="md"
              style={{ width: "100%" }}
              dark={isDark}
            />
          </GlassCard>

          <GlassCard dark={isDark} style={styles.card}>
            <Text style={styles.sectionTitle}>Reminder Automation Test</Text>
            <Text style={styles.helperText}>
              Runs due-date reminder sequence for current business.
            </Text>

            <PrimaryButton
              label={
                loadingReminders ? "Running..." : "Run Reminder Automation"
              }
              onPress={runRemindersTest}
              isLoading={loadingReminders}
              size="md"
              style={{ width: "100%" }}
              dark={isDark}
            />
          </GlassCard>

          {result ? (
            <GlassCard dark={isDark} style={styles.resultCard}>
              <Text style={styles.sectionTitle}>Result</Text>
              <Text style={styles.resultText}>{result}</Text>
            </GlassCard>
          ) : null}

          <Text style={styles.footerText}>
            {"Known location: More -> Settings -> Admin Tools"}
          </Text>
        </ScrollView>
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
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 24, gap: 10 },
    card: { gap: 8 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    providerRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    providerChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: T.border,
    },
    providerChipActive: {
      borderColor: T.primary,
      backgroundColor: "rgba(99,102,241,0.15)",
    },
    providerChipText: { color: T.textMuted, fontSize: 11, fontWeight: "700" },
    providerChipTextActive: { color: T.primary },
    helperText: { color: T.textSecondary, fontSize: 13, marginBottom: 8 },
    resultCard: { marginTop: 2 },
    resultText: {
      color: T.text,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: "monospace",
    },
    footerText: {
      color: T.textMuted,
      fontSize: 11,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 12,
    },
    centerWrap: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing.xl,
    },
    lockTitle: { ...Typography.h4, color: T.danger, marginBottom: 8 },
    lockBody: { color: T.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
