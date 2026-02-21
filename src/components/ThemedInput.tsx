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
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const isDark = backgroundColor !== "#fff";

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? "#1e1e1e" : "#f8f9fa" },
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
          placeholderTextColor="#999"
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
