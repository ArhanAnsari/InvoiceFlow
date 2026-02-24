// src/components/ui/EmptyState.tsx
import { Colors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { PrimaryButton } from "./PrimaryButton";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
  dark?: boolean;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
  dark = true,
}: EmptyStateProps) {
  const theme = dark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <PrimaryButton
          label={ctaLabel}
          onPress={onCta}
          size="md"
          dark={dark}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  iconWrap: {
    marginBottom: 20,
    opacity: 0.6,
  },
  title: {
    ...Typography.h3,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  cta: {
    paddingHorizontal: 32,
    alignSelf: "center",
  },
});
