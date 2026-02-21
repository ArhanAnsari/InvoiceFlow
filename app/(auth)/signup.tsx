import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedButton } from "@/src/components/ThemedButton";
import { ThemedInput } from "@/src/components/ThemedInput";
import { account, ID } from "@/src/services/appwrite";
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

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { checkSession } = useAuthStore();
  const bgColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      await checkSession();
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
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
          <Text style={[styles.title, { color: textColor }]}>
            Create Account
          </Text>
          <Text style={styles.subtitle}>Start billing with InvoiceFlow</Text>
        </View>

        <View style={styles.form}>
          <ThemedInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
          />
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
            placeholder="Create a strong password"
            secureTextEntry
          />

          <ThemedButton
            title="Sign Up"
            onPress={handleSignup}
            isLoading={loading}
            style={{ marginTop: 16 }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.linkText}>Sign In</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#666",
    fontSize: 15,
  },
  linkText: {
    color: "#0a7ea4",
    fontWeight: "bold",
    fontSize: 15,
  },
});
