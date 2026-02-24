// src/components/ui/SearchBar.tsx
import { Colors, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    TextInput,
    ViewStyle
} from "react-native";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  style?: ViewStyle;
  dark?: boolean;
}

export function SearchBar({
  placeholder = "Search…",
  value,
  onChangeText,
  style,
  dark = true,
}: SearchBarProps) {
  const theme = dark ? Colors.dark : Colors.light;
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.primary],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor },
        style,
      ]}
    >
      <Ionicons
        name="search"
        size={18}
        color={focused ? theme.primary : theme.textMuted}
        style={styles.icon}
      />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        style={[styles.input, { color: theme.text }]}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  icon: { marginRight: 2 },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
});
