// src/components/ui/GlassCard.tsx
import { Colors, Radius, Shadow } from "@/constants/theme";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  dark?: boolean;
  noPadding?: boolean;
}

/**
 * Frosted-glass card — uses BlurView on iOS, semi-transparent View on Android.
 */
export function GlassCard({
  children,
  style,
  intensity = 50,
  dark = true,
  noPadding = false,
}: GlassCardProps) {
  const theme = dark ? Colors.dark : Colors.light;

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint={dark ? "dark" : "light"}
        style={[
          styles.base,
          !noPadding && styles.padding,
          { borderColor: theme.border },
          Shadow.card,
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.base,
        !noPadding && styles.padding,
        {
          backgroundColor: dark
            ? "rgba(30, 32, 53, 0.88)"
            : "rgba(255,255,255,0.88)",
          borderColor: theme.border,
        },
        Shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  padding: {
    padding: 16,
  },
});
