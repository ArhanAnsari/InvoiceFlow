import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

const T = Colors.dark;

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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices/index"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "pricetag" : "pricetag-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused
                  ? "ellipsis-horizontal-circle"
                  : "ellipsis-horizontal-circle-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden screens — accessible via router.push but not shown in the tab bar */}
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="ai-assistant" options={{ href: null }} />
      <Tabs.Screen name="admin" options={{ href: null }} />
      {/* admin is intentionally excluded from the Explore section on the home screen
          because it is admin-only; it remains accessible from the More screen */}
      <Tabs.Screen name="tutorial" options={{ href: null }} />
      <Tabs.Screen name="invoices/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/create" options={{ href: null }} />
    </Tabs>
  );
}
