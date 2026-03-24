import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  actionLabel: string;
};

const STEPS: TutorialStep[] = [
  {
    id: "business",
    title: "Set up your business profile",
    description:
      "Start with business details, invoice prefix, and branding so every invoice looks professional.",
    icon: "business-outline",
    route: "/(auth)/business-setup",
    actionLabel: "Open Business Setup",
  },
  {
    id: "products",
    title: "Add products and services",
    description:
      "Create your catalog with prices, tax rates, and stock, then pick these items directly in invoices.",
    icon: "cube-outline",
    route: "/(main)/products",
    actionLabel: "Open Products",
  },
  {
    id: "invoices",
    title: "Create and share invoices",
    description:
      "Generate invoices fast, track status, and use the invoice detail QR code for quick UPI payments.",
    icon: "receipt-outline",
    route: "/(main)/invoices/create",
    actionLabel: "Create Invoice",
  },
  {
    id: "payments",
    title: "Track collections and reconcile",
    description:
      "Record partial payments, settle balances, and export payment history CSV from the Payments module.",
    icon: "wallet-outline",
    route: "/(main)/payments",
    actionLabel: "Open Payments",
  },
  {
    id: "automation",
    title: "Use smart operations",
    description:
      "Review Notification Center, Team Activity timeline, backups, and AI assistant for daily control.",
    icon: "sparkles-outline",
    route: "/(main)/more",
    actionLabel: "Open More",
  },
];

export default function TutorialScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const { tasks, loadProgress, markCompleted, resetProgress } =
    useOnboardingStore();

  const step = STEPS[index];
  const completedCount = tasks.filter((task) => task.completed).length;
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const earnedPoints = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.points, 0);
  const completionPct =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  useEffect(() => {
    loadProgress();
  }, []);

  const goPrev = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    setIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
  };

  const goToStepRoute = () => {
    router.push(step.route as any);
  };

  const handleMarkTask = async (taskId: string) => {
    try {
      await markCompleted(taskId);
    } catch (error: any) {
      Alert.alert(
        "Update failed",
        error?.message || "Unable to update checklist.",
      );
    }
  };

  const handleReset = () => {
    Alert.alert("Reset checklist", "Reset all onboarding achievements?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          void resetProgress();
        },
      },
    ]);
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
          <Text style={styles.title}>Interactive Tutorial</Text>
          <Text style={styles.counter}>
            {index + 1}/{STEPS.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard dark={isDark} style={styles.achievementCard}>
            <View style={styles.achievementHeader}>
              <Text style={styles.achievementTitle}>
                Onboarding Achievements
              </Text>
              <Pressable onPress={handleReset}>
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={T.textMuted}
                />
              </Pressable>
            </View>
            <Text style={styles.achievementMeta}>
              {completedCount}/{tasks.length} completed • {earnedPoints}/
              {totalPoints} XP
            </Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[styles.progressBarFill, { width: `${completionPct}%` }]}
              />
            </View>
          </GlassCard>

          <GlassCard dark={isDark} style={styles.heroCard}>
            <View style={styles.iconWrap}>
              <Ionicons name={step.icon} size={28} color={T.primary} />
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>

            <Pressable style={styles.mainBtn} onPress={goToStepRoute}>
              <Text style={styles.mainBtnText}>{step.actionLabel}</Text>
            </Pressable>
          </GlassCard>

          <View style={styles.progressRow}>
            {STEPS.map((s, i) => (
              <Pressable
                key={s.id}
                style={[styles.dot, i === index && styles.dotActive]}
                onPress={() => setIndex(i)}
              />
            ))}
          </View>

          <View style={styles.navRow}>
            <Pressable
              style={[styles.secondaryBtn, index === 0 && styles.disabledBtn]}
              disabled={index === 0}
              onPress={goPrev}
            >
              <Text style={styles.secondaryBtnText}>Previous</Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryBtn,
                index === STEPS.length - 1 && styles.disabledBtn,
              ]}
              disabled={index === STEPS.length - 1}
              onPress={goNext}
            >
              <Text style={styles.secondaryBtnText}>Next</Text>
            </Pressable>
          </View>

          <GlassCard dark={isDark}>
            <Text style={styles.tipTitle}>Checklist</Text>
            <View style={styles.checklistWrap}>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={styles.checklistRow}
                  onPress={() => handleMarkTask(task.id)}
                >
                  <Ionicons
                    name={
                      task.completed ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={18}
                    color={task.completed ? T.success : T.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.checklistText,
                        task.completed && styles.checklistTextDone,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.checklistPoints}>
                      +{task.points} XP
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={styles.tipTitle}>Pro tip</Text>
            <Text style={styles.tipBody}>
              Enable a UPI ID in your business profile to let customers scan and
              pay directly from invoice QR. Use Payment Export CSV weekly for
              easy reconciliation.
            </Text>
          </GlassCard>
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
    counter: {
      color: T.textMuted,
      fontSize: 12,
      fontWeight: "700",
      minWidth: 36,
      textAlign: "right",
    },
    scroll: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 24,
      gap: 12,
    },
    heroCard: {
      alignItems: "center",
      gap: 10,
      paddingVertical: 20,
    },
    achievementCard: {
      gap: 8,
      marginBottom: 6,
    },
    achievementHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    achievementTitle: {
      color: T.text,
      fontWeight: "700",
      fontSize: 14,
    },
    achievementMeta: {
      color: T.textSecondary,
      fontSize: 12,
    },
    progressBarTrack: {
      height: 8,
      borderRadius: 8,
      backgroundColor: T.border,
      overflow: "hidden",
    },
    progressBarFill: {
      height: 8,
      borderRadius: 8,
      backgroundColor: T.success,
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor: "rgba(99,102,241,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    stepTitle: { ...Typography.h3, color: T.text, textAlign: "center" },
    stepDescription: {
      color: T.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },
    mainBtn: {
      marginTop: 6,
      backgroundColor: T.primary,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 10,
    },
    mainBtnText: { color: "#fff", fontWeight: "700" },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
      marginBottom: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: T.border,
    },
    dotActive: {
      width: 22,
      backgroundColor: T.primary,
    },
    navRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 8,
    },
    secondaryBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: T.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
    },
    secondaryBtnText: { color: T.text, fontWeight: "600" },
    disabledBtn: { opacity: 0.35 },
    tipTitle: {
      color: T.primary,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    checklistWrap: { gap: 8, marginBottom: 12 },
    checklistRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: T.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    checklistText: {
      color: T.text,
      fontSize: 13,
      fontWeight: "600",
    },
    checklistTextDone: {
      color: T.success,
      textDecorationLine: "line-through",
    },
    checklistPoints: {
      color: T.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    tipBody: { color: T.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
