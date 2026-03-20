import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { BrandLogo } from "@/src/components/ui/BrandLogo";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const STEPS = ["Business Info", "Tax & Currency", "Preferences"] as const;

export default function BusinessSetupScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { user } = useAuthStore() as any;
  const { createBusiness } = useBusinessStore() as any;

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Step 0 fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Step 1 fields
  const [gstin, setGstin] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxType, setTaxType] = useState("gst");

  // Step 2 fields
  const [invoicePrefix, setInvoicePrefix] = useState("INV");

  const progress = ((step + 1) / STEPS.length) * 100;

  const nextStep = () => {
    if (step === 0 && !name.trim()) {
      Alert.alert("Required", "Business name is required.");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await createBusiness({
        userId: user.$id,
        name: name.trim(),
        gstin: gstin.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        currency,
        taxType: taxType as "gst" | "vat" | "none",
        invoicePrefix: invoicePrefix.trim() || "INV",
      });
      router.replace("/(main)");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to create business");
    } finally {
      setIsLoading(false);
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
      <View style={styles.blob1} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <BrandLogo size={60} radius={18} />
            <Text style={styles.h1}>Set up your business</Text>
            <Text style={styles.subtitle}>
              Step {step + 1} of {STEPS.length} � {STEPS[step]}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressOuter}>
            <View style={[styles.progressInner, { width: `${progress}%` }]} />
          </View>

          {/* Step tabs */}
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepItem}>
                <View
                  style={[styles.stepDot, i <= step && styles.stepDotActive]}
                >
                  {i < step ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        i === step && styles.stepNumActive,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    i === step && styles.stepLabelActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>

          <GlassCard dark={isDark} style={styles.card}>
            {step === 0 && (
              <>
                <ThemedInput
                  label="Business Name *"
                  value={name}
                  onChangeText={setName}
                  placeholder="My Business Ltd."
                  leftIcon={
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={T.textMuted}
                    />
                  }
                />
                <ThemedInput
                  label="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  leftIcon={
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={T.textMuted}
                    />
                  }
                />
                <ThemedInput
                  label="Business Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="contact@mybusiness.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={T.textMuted}
                    />
                  }
                />
                <ThemedInput
                  label="Address"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="123, Main St, City, State"
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            {step === 1 && (
              <>
                <ThemedInput
                  label="GSTIN (optional)"
                  value={gstin}
                  onChangeText={setGstin}
                  placeholder="22AAAAA0000A1Z5"
                  autoCapitalize="characters"
                  leftIcon={
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={T.textMuted}
                    />
                  }
                />
                <Text style={styles.sectionLabel}>Currency</Text>
                <View style={styles.pillRow}>
                  {["INR", "USD", "EUR", "GBP"].map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.pill, currency === c && styles.pillActive]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          currency === c && styles.pillTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.sectionLabel}>Tax Type</Text>
                <View style={styles.pillRow}>
                  {["gst", "vat", "none"].map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.pill, taxType === t && styles.pillActive]}
                      onPress={() => setTaxType(t)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          taxType === t && styles.pillTextActive,
                        ]}
                      >
                        {t.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <ThemedInput
                  label="Invoice Prefix"
                  value={invoicePrefix}
                  onChangeText={setInvoicePrefix}
                  placeholder="INV"
                  hint="e.g. INV ? INV-0001"
                  leftIcon={
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={T.textMuted}
                    />
                  }
                />
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Summary</Text>
                  <Text style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Business:</Text> {name}
                  </Text>
                  <Text style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>GSTIN:</Text> {gstin || "�"}
                  </Text>
                  <Text style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Currency:</Text> {currency}
                  </Text>
                  <Text style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Tax:</Text>{" "}
                    {taxType.toUpperCase()}
                  </Text>
                  <Text style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Invoice #:</Text>{" "}
                    {invoicePrefix}-0001
                  </Text>
                </View>
              </>
            )}

            <View style={styles.btnRow}>
              {step > 0 && (
                <PrimaryButton
                  label="Back"
                  onPress={() => setStep((s) => s - 1)}
                  variant="outline"
                  size="md"
                  style={styles.backBtn}
                />
              )}
              <PrimaryButton
                label={
                  step === STEPS.length - 1
                    ? isLoading
                      ? "Creating�"
                      : "Finish Setup"
                    : "Continue"
                }
                onPress={nextStep}
                isLoading={isLoading}
                size="md"
                style={styles.nextBtn}
              />
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: Spacing["2xl"],
      paddingVertical: Spacing["3xl"],
    },
    blob1: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: "rgba(99,102,241,0.15)",
      top: -60,
      right: -60,
    },
    header: { alignItems: "center", marginBottom: Spacing.xl },
    h1: {
      ...Typography.h2,
      color: T.text,
      marginTop: 12,
      marginBottom: 4,
      textAlign: "center",
    },
    subtitle: { ...Typography.body, color: T.textMuted, textAlign: "center" },
    progressOuter: {
      height: 4,
      backgroundColor: T.border,
      borderRadius: 2,
      marginBottom: Spacing.lg,
    },
    progressInner: { height: 4, backgroundColor: T.primary, borderRadius: 2 },
    stepRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xl,
    },
    stepItem: { alignItems: "center", flex: 1 },
    stepDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: T.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    stepDotActive: { backgroundColor: T.primary, borderColor: T.primary },
    stepNum: { fontSize: 12, color: T.textMuted, fontWeight: "700" },
    stepNumActive: { color: "#fff" },
    stepLabel: { fontSize: 10, color: T.textMuted, textAlign: "center" },
    stepLabelActive: { color: T.primary, fontWeight: "700" },
    card: { marginBottom: Spacing.lg },
    sectionLabel: {
      ...Typography.label,
      color: T.textSecondary,
      marginBottom: 10,
      marginTop: 4,
    },
    pillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: Spacing.xl,
    },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: Radius.full,
      borderWidth: 1.5,
      borderColor: T.border,
    },
    pillActive: { backgroundColor: T.primary, borderColor: T.primary },
    pillText: { fontSize: 13, color: T.textMuted, fontWeight: "600" },
    pillTextActive: { color: "#fff" },
    summaryBox: {
      backgroundColor: T.background,
      borderRadius: Radius.lg,
      padding: 14,
      marginBottom: Spacing.lg,
    },
    summaryTitle: { ...Typography.label, color: T.primary, marginBottom: 10 },
    summaryRow: { fontSize: 13, color: T.textSecondary, lineHeight: 24 },
    summaryKey: { fontWeight: "700", color: T.text },
    btnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
    backBtn: { flex: 1 },
    nextBtn: { flex: 2 },
  });
}
