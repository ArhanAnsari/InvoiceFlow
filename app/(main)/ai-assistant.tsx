import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { askInvoiceFlowAI } from "@/src/services/aiService";
import { useBusinessStore } from "@/src/store/businessStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const QUICK_PROMPTS = [
  "Summarize this month's performance.",
  "List top 5 customers by revenue.",
  "Give low-stock restock suggestions.",
  "Draft a payment reminder message.",
];

export default function AIAssistantScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { currentBusiness } = useBusinessStore();

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I can help with invoice insights, customer summaries, stock guidance, and message drafts.",
    },
  ]);

  const sendPrompt = async (value?: string) => {
    const text = (value ?? prompt).trim();
    if (!text || !currentBusiness?.$id || isLoading) return;

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      const answer = await askInvoiceFlowAI({
        businessId: currentBusiness.$id,
        prompt: text,
        mode: "insights",
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: "assistant",
          content: error?.message ?? "Unable to generate response right now.",
        },
      ]);
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
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={T.text} />
          </Pressable>
          <Text style={styles.title}>AI Assistant</Text>
          <View style={{ width: 22 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.quickRow}>
              {QUICK_PROMPTS.map((item) => (
                <Pressable
                  key={item}
                  style={styles.quickChip}
                  onPress={() => sendPrompt(item)}
                  disabled={isLoading}
                >
                  <Text style={styles.quickChipText}>{item}</Text>
                </Pressable>
              ))}
            </View>

            {messages.map((msg) => (
              <GlassCard
                key={msg.id}
                dark={isDark}
                style={[
                  styles.messageCard,
                  msg.role === "user" ? styles.userCard : styles.assistantCard,
                ]}
              >
                <Text style={styles.messageRole}>
                  {msg.role === "user" ? "You" : "InvoiceFlow AI"}
                </Text>
                <Text style={styles.messageText}>{msg.content}</Text>
              </GlassCard>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>

          <GlassCard dark={isDark} style={styles.inputBar}>
            <ThemedInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Ask for insights, reminders, summaries..."
              multiline
              numberOfLines={2}
              containerStyle={{ marginBottom: 8 }}
            />
            <PrimaryButton
              label={isLoading ? "Thinking..." : "Send"}
              onPress={() => sendPrompt()}
              isLoading={isLoading}
              size="md"
              style={{ width: "100%" }}
              dark={isDark}
            />
          </GlassCard>
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
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 16 },
    quickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: Spacing.md,
    },
    quickChip: {
      borderWidth: 1,
      borderColor: T.border,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: T.surface,
    },
    quickChipText: {
      fontSize: 12,
      color: T.textMuted,
      fontWeight: "600",
    },
    messageCard: { marginBottom: 10 },
    userCard: { borderColor: T.primary },
    assistantCard: {},
    messageRole: {
      fontSize: 11,
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 6,
      fontWeight: "700",
    },
    messageText: { fontSize: 14, color: T.text, lineHeight: 20 },
    inputBar: {
      marginHorizontal: Spacing.xl,
      marginBottom: Platform.OS === "ios" ? 24 : 12,
    },
  });
}
