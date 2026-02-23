import { ThemedButton } from "@/src/components/ThemedButton";
import { ThemedInput } from "@/src/components/ThemedInput";
import { account } from "@/src/services/appwrite";
import { useAuthStore } from "@/src/store/authStore";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { checkSession } = useAuthStore();
  const bgColor = "#151718"; // Hardcoded dark background
  const textColor = "#ECEDEE"; // Hardcoded light text
  const textSecondaryColor = "#9BA1A6"; // Hardcoded secondary text

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      await checkSession();
      router.replace("/(main)"); // Explicit redirect
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>IF</Text>
          </View>
          <Text style={[styles.title, { color: textColor }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
            Sign in to continue to InvoiceFlow
          </Text>
        </View>

        <View style={styles.form}>
          <ThemedInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="name@company.com"
            keyboardType="email-address"
          />
          <ThemedInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          <View style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </View>

          <ThemedButton
            title="Sign In"
            onPress={handleLogin}
            isLoading={loading}
            style={{ marginTop: 10 }}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textSecondaryColor }]}>
              Don't have an account?{" "}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Text style={styles.linkText}>Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(10, 126, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0a7ea4",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: "100%",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#0a7ea4",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
  },
  linkText: {
    color: "#0a7ea4",
    fontWeight: "bold",
    fontSize: 15,
  },
});
