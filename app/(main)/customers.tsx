import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { Avatar } from "@/src/components/ui/Avatar";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { TabSwipeContainer } from "@/src/components/ui/TabSwipeContainer";
import { useBusinessStore } from "@/src/store/businessStore";
import { useCustomerStore } from "@/src/store/customerStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomersScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { customers, fetchCustomers, addCustomer, isLoading } =
    useCustomerStore() as any;
  const { currentBusiness } = useBusinessStore();
  const currencySymbol = (currentBusiness as any)?.currencySymbol || "₹";

  const [query, setQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");

  const load = useCallback(() => {
    if (currentBusiness?.$id) fetchCustomers(currentBusiness.$id);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [currentBusiness]);

  const filtered = (customers ?? []).filter(
    (c: any) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query) ||
      c.email?.toLowerCase().includes(query.toLowerCase()),
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setGstin("");
  };
  const closeModal = () => {
    resetForm();
    setModalVisible(false);
  };

  const handleAdd = async () => {
    if (!currentBusiness?.$id) {
      closeModal();
      router.push("/(auth)/business-setup" as any);
      return;
    }

    if (!name.trim()) return;
    await addCustomer({
      businessId: currentBusiness?.$id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      gstin: gstin.trim(),
    });
    closeModal();
  };

  if (!currentBusiness) {
    return (
      <TabSwipeContainer currentRoute="/(main)/customers">
        <LinearGradient
          colors={
            isDark
              ? ["#0D0F1E", "#131629", "#0D0F1E"]
              : ["#EEF2FF", "#F5F7FA", "#F0F4FF"]
          }
          style={styles.root}
        >
          <EmptyState
            icon={
              <Ionicons name="business-outline" size={56} color={T.textMuted} />
            }
            title="Business setup required"
            subtitle="Set up your business before adding customers."
            ctaLabel="Set up business"
            onCta={() => router.push("/(auth)/business-setup" as any)}
            dark={isDark}
          />
        </LinearGradient>
      </TabSwipeContainer>
    );
  }

  return (
    <TabSwipeContainer currentRoute="/(main)/customers">
      <LinearGradient
        colors={
          isDark
            ? ["#0D0F1E", "#131629", "#0D0F1E"]
            : ["#EEF2FF", "#F5F7FA", "#F0F4FF"]
        }
        style={styles.root}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Customers</Text>
              <Text style={styles.subtitle}>{filtered.length} total</Text>
            </View>
            <Pressable
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search customers"
              dark={isDark}
            />
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              icon={
                <Ionicons name="people-outline" size={56} color={T.textMuted} />
              }
              title={query ? "No results found" : "No customers yet"}
              subtitle={
                query
                  ? "Try a different search term."
                  : "Add your first customer to get started."
              }
              ctaLabel={query ? undefined : "Add Customer"}
              onCta={query ? undefined : () => setModalVisible(true)}
              dark={isDark}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.$id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={load}
              renderItem={({ item }) => (
                <GlassCard dark={isDark} noPadding style={styles.card}>
                  <View style={styles.row}>
                    <Avatar name={item.name} size={44} />
                    <View style={styles.info}>
                      <Text style={styles.customerName}>{item.name}</Text>
                      {item.phone ? (
                        <Text style={styles.meta}>
                          <Ionicons
                            name="call-outline"
                            size={12}
                            color={T.textMuted}
                          />{" "}
                          {item.phone}
                        </Text>
                      ) : null}
                      {item.email ? (
                        <Text style={styles.meta}>
                          <Ionicons
                            name="mail-outline"
                            size={12}
                            color={T.textMuted}
                          />{" "}
                          {item.email}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.balanceCol}>
                      {item.balance > 0 ? (
                        <>
                          <Text style={styles.balanceLabel}>Balance</Text>
                          <Text style={[styles.balance, { color: T.danger }]}>
                            {currencySymbol}
                            {item.balance.toLocaleString()}
                          </Text>
                        </>
                      ) : (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={T.success}
                        />
                      )}
                    </View>
                  </View>
                </GlassCard>
              )}
            />
          )}

          {/* Add Customer Modal */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={closeModal}
          >
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <GlassCard dark={isDark} style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Customer</Text>
                    <Pressable onPress={closeModal} hitSlop={10}>
                      <Ionicons name="close" size={22} color={T.textMuted} />
                    </Pressable>
                  </View>
                  <ThemedInput
                    label="Name *"
                    value={name}
                    onChangeText={setName}
                    placeholder="Customer name"
                  />
                  <ThemedInput
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                  />
                  <ThemedInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <ThemedInput
                    label="GSTIN"
                    value={gstin}
                    onChangeText={setGstin}
                    placeholder="22AAAAA0000A1Z5"
                    autoCapitalize="characters"
                  />
                  <ThemedInput
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Full address"
                    multiline
                    numberOfLines={2}
                  />
                  <PrimaryButton
                    label={isLoading ? "Adding�" : "Add Customer"}
                    onPress={handleAdd}
                    isLoading={isLoading}
                    size="lg"
                    style={{ width: "100%" }}
                  />
                </GlassCard>
              </KeyboardAvoidingView>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </TabSwipeContainer>
  );
}

function createStyles(T: typeof Colors.dark) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    title: { ...Typography.h2, color: T.text },
    subtitle: { fontSize: 13, color: T.textMuted, marginTop: 2 },
    addBtn: {
      width: 44,
      height: 44,
      backgroundColor: T.primary,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    searchWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
    card: { marginBottom: 8 },
    row: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
    info: { flex: 1, gap: 3 },
    customerName: { ...Typography.label, color: T.text, fontWeight: "600" },
    meta: { fontSize: 12, color: T.textMuted },
    balanceCol: { alignItems: "flex-end" },
    balanceLabel: { fontSize: 10, color: T.textMuted, marginBottom: 2 },
    balance: { fontSize: 14, fontWeight: "700" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalCard: { margin: 12, borderRadius: Radius.xl },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    modalTitle: { ...Typography.h3, color: T.text },
  });
}
