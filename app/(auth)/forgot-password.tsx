import {
    Colors,
    Gradients,
    Spacing,
    Typography
} from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      // TODO: integrate Appwrite account.createRecovery(email, redirectUrl)
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={Gradients.primary}
            style={styles.icon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="lock-open-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.h1}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            {sent
              ? "Recovery email sent! Check your inbox."
              : "Enter your email and we'll send you a recovery link."}
          </Text>
        </View>

        <GlassCard dark={isDark} style={styles.card}>
          {!sent ? (
            <>
              <ThemedInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={
                  <Ionicons name="mail-outline" size={18} color={T.textMuted} />
                }
              />
              <PrimaryButton
                label={isLoading ? "Sending…" : "Send Recovery Email"}
                onPress={handleSend}
                isLoading={isLoading}
                size="lg"
                dark={isDark}
                style={{ width: "100%", marginTop: 8 }}
              />
            </>
          ) : (
            <View style={styles.successBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color={T.success}
              />
              <Text style={styles.successText}>
                Check your email inbox for the recovery link.
              </Text>
            </View>
          )}
        </GlassCard>

        <PrimaryButton
          label="Back to Login"
          onPress={() => router.back()}
          variant="ghost"
          size="md"
          dark={isDark}
          style={styles.backBtn}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    inner: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing["2xl"],
    },
    header: { alignItems: "center", marginBottom: Spacing.xl },
    icon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    h1: {
      ...Typography.h2,
      color: T.text,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      ...Typography.body,
      color: T.textMuted,
      textAlign: "center",
      lineHeight: 22,
    },
    card: { marginBottom: Spacing.xl },
    successBox: { alignItems: "center", gap: 12, paddingVertical: 8 },
    successText: {
      ...Typography.body,
      color: T.textSecondary,
      textAlign: "center",
    },
    backBtn: { alignSelf: "center" },
  });
}
