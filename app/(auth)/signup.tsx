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

function PasswordStrength({ password }: { password: string }) {
  const T = useTheme();
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const colors = ["#555", "#EF4444", "#F59E0B", "#10B981", "#10B981"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;
  return (
    <View style={pwStyles.row}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            pwStyles.bar,
            { backgroundColor: i <= score ? colors[score] : T.border },
          ]}
        />
      ))}
      <Text style={[pwStyles.label, { color: colors[score] }]}>
        {labels[score]}
      </Text>
    </View>
  );
}

const pwStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -8,
    marginBottom: 12,
  },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: "600", marginLeft: 4, minWidth: 36 },
});

export default function SignupScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore() as any;
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (!agreed) {
      Alert.alert("Terms", "Please agree to the terms and conditions.");
      return;
    }
    try {
      await register(email.trim(), password, name.trim());
      router.replace("/(auth)/business-setup");
    } catch (e: any) {
      Alert.alert("Signup Failed", e?.message ?? "Something went wrong");
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
      <View style={styles.blob2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={T.text} />
          </Pressable>

          <View style={styles.header}>
            <LinearGradient
              colors={Gradients.primary}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="receipt-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.h1}>Create Account</Text>
            <Text style={styles.subtitle}>Start your 14-day free trial</Text>
          </View>

          <GlassCard dark={isDark} style={styles.card}>
            <ThemedInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              autoCapitalize="words"
              autoComplete="name"
              leftIcon={
                <Ionicons name="person-outline" size={18} color={T.textMuted} />
              }
            />
            <ThemedInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={
                <Ionicons name="mail-outline" size={18} color={T.textMuted} />
              }
            />
            <ThemedInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secureTextEntry={!showPassword}
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
            <PasswordStrength password={password} />

            {/* Terms */}
            <Pressable
              style={styles.termsRow}
              onPress={() => setAgreed((a) => !a)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Pressable>

            <PrimaryButton
              label={isLoading ? "Creating account…" : "Create Account"}
              onPress={handleSignup}
              isLoading={isLoading}
              size="lg"
              dark={isDark}
              style={styles.cta}
            />
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.footerLink}> Sign in</Text>
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
    scroll: {
      flexGrow: 1,
      paddingHorizontal: Spacing["2xl"],
      paddingVertical: Spacing["3xl"],
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
    back: { marginBottom: Spacing.xl },
    header: { alignItems: "center", marginBottom: Spacing["2xl"] },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    h1: { ...Typography.h1, color: T.text, marginBottom: 4 },
    subtitle: { ...Typography.body, color: T.textMuted },
    card: { marginBottom: Spacing.xl },
    termsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: Spacing.xl,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: T.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: { backgroundColor: T.primary, borderColor: T.primary },
    termsText: {
      flex: 1,
      fontSize: 13,
      color: T.textSecondary,
      lineHeight: 20,
    },
    termsLink: { color: T.primary, fontWeight: "600" },
    cta: { width: "100%" },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: Spacing.lg,
    },
    footerText: { ...Typography.body, color: T.textMuted },
    footerLink: { ...Typography.body, color: T.primary, fontWeight: "700" },
  });
}
