import { useThemeColor } from "@/hooks/use-theme-color";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface Props extends TextInputProps {
  label?: string;
}

export function ThemedInput({ label, style, ...props }: Props) {
  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor(
    {
      light: "#9BA1A6",
      dark: "#9BA1A6", // Light gray for dark mode
    },
    "textSecondary",
  );
  const inputBackground = useThemeColor(
    {
      light: "#F0F0F0",
      dark: "#232627", // Slightly lighter than background
    },
    "background",
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: inputBackground },
          props.multiline && styles.multilineContainer,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: textColor },
            style,
            props.multiline && styles.multilineInput,
          ]}
          placeholderTextColor={placeholderColor}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
  },
  multilineContainer: {
    minHeight: 100,
  },
  input: {
    padding: 16,
    fontSize: 16,
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 100,
  },
});
