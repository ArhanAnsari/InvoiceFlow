import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  return (
    <BlurView
      tint={colorScheme === "dark" ? "dark" : "light"}
      intensity={80}
      style={[
        StyleSheet.absoluteFill,
        {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor:
            colorScheme === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.1)",
        },
      ]}
    />
  );
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
