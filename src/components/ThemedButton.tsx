import { useThemeColor } from "@/hooks/use-theme-color";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

interface Props {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  style?: ViewStyle;
}

export function ThemedButton({
  title,
  onPress,
  isLoading,
  variant = "primary",
  style,
}: Props) {
  const primaryColor = useThemeColor({}, "tint");

  let backgroundColor = primaryColor;
  let textColor = "#fff";
  let borderWidth = 0;

  if (variant === "outline") {
    backgroundColor = "transparent";
    textColor = primaryColor;
    borderWidth = 1.5;
  } else if (variant === "secondary") {
    backgroundColor = "rgba(10, 126, 164, 0.1)";
    textColor = primaryColor;
  } else if (variant === "ghost") {
    backgroundColor = "transparent";
    textColor = primaryColor;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderWidth, borderColor: primaryColor },
        variant === "primary" && styles.shadow,
        style,
      ]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    width: "100%",
    flexDirection: "row",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  shadow: {
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
