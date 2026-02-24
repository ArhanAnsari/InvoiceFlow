// src/components/ui/Avatar.tsx
import { Gradients } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Image,
    ImageStyle,
    StyleSheet,
    Text
} from "react-native";

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  style?: ImageStyle;
}

function getInitials(name = ""): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function Avatar({ name, uri, size = 40, style }: AvatarProps) {
  const fontSize = Math.max(10, Math.round(size * 0.38));

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      />
    );
  }

  return (
    <LinearGradient
      colors={Gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  image: {
    resizeMode: "cover",
  },
});
