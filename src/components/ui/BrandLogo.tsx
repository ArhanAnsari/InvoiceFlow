import { Image } from "expo-image";
import React from "react";
import { StyleSheet } from "react-native";

interface BrandLogoProps {
  size?: number;
  radius?: number;
}

export function BrandLogo({ size = 72, radius = 20 }: BrandLogoProps) {
  return (
    <Image
      source={require("@/assets/images/app-assets/ios/icons/ios-icon-512.png")}
      contentFit="cover"
      transition={100}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
});
