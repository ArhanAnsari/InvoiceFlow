import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedButton } from "@/src/components/ThemedButton";
import { ThemedInput } from "@/src/components/ThemedInput";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const {
    currentBusiness,
    businesses,
    fetchBusinesses,
    createBusiness,
    isLoading,
  } = useBusinessStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [bizName, setBizName] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");

  const textColor = useThemeColor({}, "text");
  const bgColor = useThemeColor({}, "background");
  const isDark = bgColor !== "#fff";

  useEffect(() => {
    if (user) {
      fetchBusinesses(user.$id);
    }
  }, [user]);

  const handleCreateBusiness = async () => {
    if (!user || !bizName) return;
    await createBusiness(user.$id, bizName, gstin, address);
    setShowCreateModal(false);
  };

  if (isLoading && !currentBusiness) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <Text style={{ color: textColor }}>Loading Business...</Text>
      </View>
    );
  }

  if (!currentBusiness) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <ScrollView contentContainerStyle={styles.setupContainer}>
          <View style={styles.setupHeader}>
            <IconSymbol name="briefcase.fill" size={48} color="#0a7ea4" />
            <Text style={[styles.setupTitle, { color: textColor }]}>
              Welcome, {user?.name?.split(" ")[0]}
            </Text>
            <Text style={styles.setupSubtitle}>
              Let's set up your business profile to start creating invoices.
            </Text>
          </View>

          <View style={styles.setupForm}>
            <ThemedInput
              label="Business Name"
              value={bizName}
              onChangeText={setBizName}
              placeholder="e.g. Acme Corp"
            />
            <ThemedInput
              label="GSTIN (Optional)"
              value={gstin}
              onChangeText={setGstin}
              placeholder="Enter GST Number"
            />
            <ThemedInput
              label="Address (Optional)"
              value={address}
              onChangeText={setAddress}
              placeholder="City, State"
            />

            <ThemedButton
              title="Create Business"
              onPress={handleCreateBusiness}
              isLoading={isLoading}
              style={{ marginTop: 16 }}
            />
            <ThemedButton title="Logout" onPress={logout} variant="ghost" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.bizName, { color: textColor }]}>
              {currentBusiness.name}
            </Text>
            <Text style={styles.bizGstin}>
              {currentBusiness.gstin
                ? `GSTIN: ${currentBusiness.gstin}`
                : "No GSTIN Added"}
            </Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {currentBusiness.name.charAt(0)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#1e1e1e" : "#f8f9fa" },
            ]}
          >
            <View style={styles.statIconContainer}>
              <IconSymbol
                name="indianrupeesign.circle.fill"
                size={24}
                color="#0a7ea4"
              />
            </View>
            <Text style={styles.statLabel}>Today's Sales</Text>
            <Text style={[styles.statValue, { color: textColor }]}>₹0</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#1e1e1e" : "#f8f9fa" },
            ]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "rgba(52, 199, 89, 0.1)" },
              ]}
            >
              <IconSymbol name="doc.text.fill" size={24} color="#34c759" />
            </View>
            <Text style={styles.statLabel}>All Invoices</Text>
            <Text style={[styles.statValue, { color: textColor }]}>0</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Quick Actions
          </Text>
          <View style={styles.actions}>
            <ThemedButton title="Create New Invoice" onPress={() => {}} />
            <ThemedButton
              title="Add Customer"
              onPress={() => {}}
              variant="secondary"
            />
          </View>
        </View>

        <View style={{ marginTop: 40, marginBottom: 20 }}>
          <ThemedButton title="Logout" onPress={logout} variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100, // Space for tab bar
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  setupContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  setupHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  setupForm: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    marginTop: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  bizName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bizGstin: {
    fontSize: 14,
    color: "#666",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(10, 126, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0a7ea4",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statCard: {
    padding: 20,
    borderRadius: 16,
    width: "48%",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10, 126, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  actions: {
    gap: 12,
  },
});
