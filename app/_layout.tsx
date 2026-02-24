import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initDatabase } from "@/src/services/database";
import "@/src/services/sync";
import { useAuthStore } from "@/src/store/authStore";
import { useUIStore } from "@/src/store/uiStore";

SplashScreen.preventAutoHideAsync();

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.dark.primary,
  },
};

const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    primary: Colors.light.primary,
  },
};

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useUIStore();
  const { checkSession, user, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");
  const navTheme = isDark ? AppDarkTheme : AppLightTheme;

  useEffect(() => {
    initDatabase();
    checkSession();
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(main)");
    }
  }, [user, segments, isLoading, isMounted]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.dark.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}
