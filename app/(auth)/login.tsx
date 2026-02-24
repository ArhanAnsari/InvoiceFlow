import {
  Colors,
  Gradients,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { useAuthStore } from "@/src/store/authStore";
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

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore() as any;
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter email and password.");
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Login Failed", e?.message ?? "Invalid credentials");
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
      {/* Background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={Gradients.primary}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="receipt-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>InvoiceFlow</Text>
            <Text style={styles.tagline}>
              Smart billing for modern businesses
            </Text>
          </View>

          {/* Card */}
          <GlassCard dark={isDark} style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {/* Tab switcher */}
            <View style={styles.tabRow}>
              {(["email", "phone"] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.tab, tab === t && styles.tabActive]}
                  onPress={() => setTab(t)}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      tab === t && styles.tabLabelActive,
                    ]}
                  >
                    {t === "email" ? "Email" : "Phone OTP"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === "email" ? (
              <>
                <ThemedInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={T.textMuted}
                    />
                  }
                />
                <ThemedInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={T.textMuted}
                    />
                  }
                  rightIcon={
                    <Pressable
                      onPress={() => setShowPassword((p) => !p)}
                      hitSlop={10}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color={T.textMuted}
                      />
                    </Pressable>
                  }
                />
              </>
            ) : (
              <ThemedInput
                label="Phone Number"
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                leftIcon={
                  <Ionicons name="call-outline" size={18} color={T.textMuted} />
                }
              />
            )}

            <Pressable
              style={styles.forgotRow}
              onPress={() => router.push("/(auth)/forgot-password" as any)}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <PrimaryButton
              label={isLoading ? "Signing in" : "Sign in"}
              onPress={handleLogin}
              isLoading={isLoading}
              size="lg"
              dark={isDark}
              style={styles.cta}
            />
          </GlassCard>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}> Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing["2xl"],
      paddingVertical: Spacing["4xl"],
    },
    blob1: {
      position: "absolute",
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: "rgba(99,102,241,0.18)",
      top: -80,
      right: -80,
    },
    blob2: {
      position: "absolute",
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: "rgba(139,92,246,0.12)",
      bottom: 60,
      left: -60,
    },
    logoSection: {
      alignItems: "center",
      marginBottom: Spacing["3xl"],
    },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    appName: {
      ...Typography.h1,
      color: "#fff",
      marginBottom: 6,
    },
    tagline: {
      ...Typography.body,
      color: T.textMuted,
    },
    card: {
      marginBottom: Spacing.xl,
    },
    cardTitle: {
      ...Typography.h2,
      color: T.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      ...Typography.body,
      color: T.textMuted,
      marginBottom: Spacing.xl,
    },
    tabRow: {
      flexDirection: "row",
      backgroundColor: T.background,
      borderRadius: Radius.lg,
      padding: 4,
      marginBottom: Spacing.xl,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: Radius.md,
    },
    tabActive: {
      backgroundColor: T.surface,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: T.textMuted,
    },
    tabLabelActive: {
      color: T.text,
      fontWeight: "700",
    },
    forgotRow: {
      alignItems: "flex-end",
      marginTop: -8,
      marginBottom: Spacing.xl,
    },
    forgotText: {
      fontSize: 13,
      color: T.primary,
      fontWeight: "500",
    },
    cta: { width: "100%" },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: Spacing.lg,
    },
    footerText: {
      ...Typography.body,
      color: T.textMuted,
    },
    footerLink: {
      ...Typography.body,
      color: T.primary,
      fontWeight: "700",
    },
  });
}
