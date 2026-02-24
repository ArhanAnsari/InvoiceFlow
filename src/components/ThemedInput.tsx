import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Colors, Radius } from "@/constants/theme";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  dark?: boolean;
}

export function ThemedInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  dark = true,
  ...props
}: Props) {
  const theme = dark ? Colors.dark : Colors.light;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    props.onFocus?.({} as any);
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    props.onBlur?.({} as any);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? theme.danger : theme.border, error ? theme.danger : theme.primary],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: focused ? theme.primary : theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <Animated.View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.surface, borderColor },
          props.multiline && styles.multilineContainer,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          style={[
            styles.input,
            { color: theme.text, paddingLeft: leftIcon ? 8 : 16 },
            style,
            props.multiline && styles.multilineInput,
          ]}
          placeholderTextColor={theme.placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </Animated.View>
      {error ? (
        <Text style={[styles.hint, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  inputContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  multilineContainer: {
    minHeight: 100,
    alignItems: "flex-start",
  },
  iconLeft: { paddingLeft: 14, paddingRight: 2 },
  iconRight: { paddingRight: 14 },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
