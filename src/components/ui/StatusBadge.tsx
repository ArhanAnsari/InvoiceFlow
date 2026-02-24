// src/components/ui/StatusBadge.tsx
import { Colors, Radius } from "@/constants/theme";
import { StatusVariant } from "@/src/types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatusBadgeProps {
  status: StatusVariant;
  dark?: boolean;
}

const CONFIG: Record<
  StatusVariant,
  { label: string; color: string; bg: string }
> = {
  paid: {
    label: "Paid",
    color: Colors.dark.success,
    bg: Colors.dark.successBg,
  },
  unpaid: {
    label: "Unpaid",
    color: Colors.dark.danger,
    bg: Colors.dark.dangerBg,
  },
  partial: {
    label: "Partial",
    color: Colors.dark.warning,
    bg: Colors.dark.warningBg,
  },
  cancelled: {
    label: "Cancelled",
    color: Colors.dark.textMuted,
    bg: Colors.dark.surface,
  },
  overdue: {
    label: "Overdue",
    color: "#FF6B6B",
    bg: "rgba(255,107,107,0.15)",
  },
};

export function StatusBadge({ status, dark = true }: StatusBadgeProps) {
  const cfg = CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
