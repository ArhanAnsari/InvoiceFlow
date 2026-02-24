// src/components/ui/MetricCard.tsx
import { Colors, Radius, Shadow, Typography } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number; // positive = up, negative = down
  icon?: React.ReactNode;
  gradient?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  dark?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  gradient,
  style,
  dark = true,
}: MetricCardProps) {
  const theme = dark ? Colors.dark : Colors.light;
  const trendColor =
    trend === undefined
      ? theme.textMuted
      : trend >= 0
        ? theme.success
        : theme.danger;
  const trendLabel =
    trend === undefined
      ? ""
      : `${trend >= 0 ? "▲" : "▼"} ${Math.abs(trend).toFixed(1)}%`;

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, Shadow.card, style]}
      >
        <View style={styles.row}>
          <Text style={[styles.title, { color: "rgba(255,255,255,0.8)" }]}>
            {title}
          </Text>
          {icon && <View style={styles.icon}>{icon}</View>}
        </View>
        <Text style={[styles.value, { color: "#fff" }]}>{value}</Text>
        <View style={styles.bottom}>
          {subtitle ? (
            <Text style={[styles.sub, { color: "rgba(255,255,255,0.7)" }]}>
              {subtitle}
            </Text>
          ) : null}
          {trendLabel ? (
            <Text style={[styles.trend, { color: "rgba(255,255,255,0.85)" }]}>
              {trendLabel}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
        },
        Shadow.card,
        style,
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>
          {title}
        </Text>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <View style={styles.bottom}>
        {subtitle ? (
          <Text style={[styles.sub, { color: theme.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
        {trendLabel ? (
          <Text style={[styles.trend, { color: trendColor }]}>
            {trendLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 16,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  icon: { opacity: 0.85 },
  title: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  value: {
    ...Typography.h2,
    marginTop: 6,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sub: {
    fontSize: 12,
  },
  trend: {
    fontSize: 12,
    fontWeight: "600",
  },
});
