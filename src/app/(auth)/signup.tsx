import { ThemedButton } from "@/src/components/ThemedButton";
import { ThemedInput } from "@/src/components/ThemedInput";
import { account, ID } from "@/src/services/appwrite";
import { useAuthStore } from "@/src/store/authStore";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { checkSession } = useAuthStore();

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Account
      await account.create(ID.unique(), email, password, name);

      // 2. Auto Login
      await account.createEmailPasswordSession(email, password);

      await checkSession();
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start billing with InvoiceFlow</Text>
      </View>

      <View style={styles.form}>
        <ThemedInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Business Owner Name"
        />
        <ThemedInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
        />
        <ThemedInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          secureTextEntry
        />

        <ThemedButton
          title="Sign Up"
          onPress={handleSignup}
          isLoading={loading}
        />

        <Link href="/(auth)/login" asChild>
          <ThemedButton
            title="Already have an account? Login"
            onPress={() => {}}
            variant="outline"
          />
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0a7ea4",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
});
