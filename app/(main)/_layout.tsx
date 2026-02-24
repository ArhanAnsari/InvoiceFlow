import { Colors, Shadow } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

const T = Colors.dark;

function FABButton() {
  const router = useRouter();
  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(main)/invoices/create" as any);
  };
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="add" size={30} color="#fff" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textMuted,
        tabBarStyle: {
          backgroundColor: T.surface,
          borderTopColor: T.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          ...(Platform.OS === "ios" ? { position: "absolute" } : {}),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "",
          tabBarIcon: () => <FABButton />,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    ...Shadow.elevated,
  },
});
