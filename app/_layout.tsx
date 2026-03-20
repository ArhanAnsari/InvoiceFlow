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
import { syncEngine } from "@/src/services/sync";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { useUIStore } from "@/src/store/uiStore";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://4c2a00d4711220e3d7e4307ed4aaf485@o4508228539645952.ingest.us.sentry.io/4511071889784832",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

export default Sentry.wrap(function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useUIStore();
  const { checkSession, user, isLoading } = useAuthStore();
  const {
    currentBusiness,
    fetchBusinesses,
    isLoading: isBusinessLoading,
  } = useBusinessStore();
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
    if (!user?.$id) return;
    fetchBusinesses(user.$id);
  }, [user?.$id]);

  useEffect(() => {
    if (!currentBusiness?.$id) return;

    const unsubscribe = syncEngine.subscribe(currentBusiness.$id);
    return () => unsubscribe();
  }, [currentBusiness?.$id]);

  useEffect(() => {
    if (!isMounted || isLoading || isBusinessLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const onBusinessSetup = inAuthGroup && segments[1] === "business-setup";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (!user) return;

    if (!currentBusiness && !onBusinessSetup) {
      router.replace("/(auth)/business-setup");
      return;
    }

    if (user && inAuthGroup && !onBusinessSetup) {
      router.replace("/(main)");
    }
  }, [
    user,
    currentBusiness,
    segments,
    isLoading,
    isBusinessLoading,
    isMounted,
  ]);

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
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
});
