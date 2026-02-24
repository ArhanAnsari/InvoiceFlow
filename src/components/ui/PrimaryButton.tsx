// src/components/ui/PrimaryButton.tsx
import { Colors, Gradients, Radius, Typography } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
} from "react-native";

type Variant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  dark?: boolean;
}

const HEIGHT: Record<Size, number> = { sm: 40, md: 52, lg: 60 };

const LABEL_SIZE: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  style,
  dark = true,
}: PrimaryButtonProps) {
  const theme = dark ? Colors.dark : Colors.light;
  const isDisabled = disabled || isLoading;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const gradientColors = (): readonly [string, string, ...string[]] => {
    if (variant === "danger") return Gradients.danger;
    if (variant === "secondary") return Gradients.primaryDark;
    return Gradients.primary;
  };

  if (variant === "outline") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          {
            height: HEIGHT[size],
            borderColor: theme.primary,
            borderWidth: 1.5,
          },
          pressed && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.primary} size="small" />
        ) : (
          <Text
            style={[
              styles.label,
              { color: theme.primary, fontSize: LABEL_SIZE[size] },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  if (variant === "ghost") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          { height: HEIGHT[size] },
          pressed && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.primary} size="small" />
        ) : (
          <Text
            style={[
              styles.label,
              { color: theme.primary, fontSize: LABEL_SIZE[size] },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.gradientWrapper,
        { height: HEIGHT[size] },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { height: HEIGHT[size] }]}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text
            style={[
              styles.label,
              styles.labelWhite,
              { fontSize: LABEL_SIZE[size] },
            ]}
          >
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  gradientWrapper: {
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  label: {
    ...Typography.label,
    fontWeight: "600",
  },
  labelWhite: {
    color: "#fff",
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.4 },
});
