import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsDark, useTheme } from "@/hooks/use-theme";
import { ThemedInput } from "@/src/components/ThemedInput";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { TabSwipeContainer } from "@/src/components/ui/TabSwipeContainer";
import { useBusinessStore } from "@/src/store/businessStore";
import { useProductStore } from "@/src/store/productStore";
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

export default function ProductsScreen() {
  const T = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(T), [T]);
  const router = useRouter();
  const { products, fetchProducts, addProduct, isLoading } =
    useProductStore() as any;
  const { currentBusiness } = useBusinessStore();

  const [query, setQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  const [unit, setUnit] = useState("pcs");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [hsnCode, setHsnCode] = useState("");

  const load = useCallback(() => {
    if (currentBusiness?.$id) fetchProducts(currentBusiness.$id);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [currentBusiness]);

  const filtered = (products ?? []).filter(
    (p: any) =>
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku?.includes(query),
  );

  const resetForm = () => {
    setName("");
    setPrice("");
    setTaxRate("18");
    setUnit("pcs");
    setStock("0");
    setDescription("");
    setHsnCode("");
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

    if (!name.trim() || !price.trim()) return;
    await addProduct({
      businessId: currentBusiness?.$id,
      name: name.trim(),
      price: parseFloat(price),
      taxRate: parseFloat(taxRate) || 0,
      unit: unit.trim() || "pcs",
      stock: parseInt(stock) || 0,
      description: description.trim(),
      hsnCode: hsnCode.trim(),
      isService: false,
      isActive: true,
    });
    closeModal();
  };

  if (!currentBusiness) {
    return (
      <TabSwipeContainer currentRoute="/(main)/products">
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
            subtitle="Set up your business before adding products."
            ctaLabel="Set up business"
            onCta={() => router.push("/(auth)/business-setup" as any)}
            dark={isDark}
          />
        </LinearGradient>
      </TabSwipeContainer>
    );
  }

  return (
    <TabSwipeContainer currentRoute="/(main)/products">
      <LinearGradient
        colors={
          isDark
            ? ["#0D0F1E", "#131629", "#0D0F1E"]
            : ["#EEF2FF", "#F5F7FA", "#F0F4FF"]
        }
        style={styles.root}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Products</Text>
              <Text style={styles.subtitle}>{filtered.length} items</Text>
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
              placeholder="Search products�"
              dark={isDark}
            />
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              icon={
                <Ionicons name="cube-outline" size={56} color={T.textMuted} />
              }
              title={query ? "No results found" : "No products yet"}
              subtitle={
                query
                  ? "Try a different search."
                  : "Add your products or services to create invoices."
              }
              ctaLabel={query ? undefined : "Add Product"}
              onCta={query ? undefined : () => setModalVisible(true)}
              dark={isDark}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.$id}
              contentContainerStyle={styles.list}
              numColumns={2}
              columnWrapperStyle={styles.columns}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={load}
              renderItem={({ item }) => (
                <GlassCard dark={isDark} style={styles.productCard}>
                  <View style={styles.productIcon}>
                    <Ionicons
                      name={
                        item.isService ? "briefcase-outline" : "cube-outline"
                      }
                      size={22}
                      color={T.primary}
                    />
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    ?{parseFloat(item.price).toLocaleString()}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productUnit}>{item.unit}</Text>
                    <Text style={styles.productTax}>{item.taxRate}% GST</Text>
                  </View>
                  {!item.isService && (
                    <View
                      style={[
                        styles.stockBadge,
                        item.stock <= (item.lowStockThreshold ?? 5) &&
                          styles.stockLow,
                      ]}
                    >
                      <Text style={styles.stockText}>
                        {item.stock <= (item.lowStockThreshold ?? 5)
                          ? "? "
                          : ""}
                        {item.stock} {item.unit}
                      </Text>
                    </View>
                  )}
                </GlassCard>
              )}
            />
          )}

          {/* Add Modal */}
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
                    <Text style={styles.modalTitle}>Add Product</Text>
                    <Pressable onPress={closeModal} hitSlop={10}>
                      <Ionicons name="close" size={22} color={T.textMuted} />
                    </Pressable>
                  </View>
                  <ThemedInput
                    label="Product Name *"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Widget Pro"
                  />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <ThemedInput
                        label="Selling Price *"
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedInput
                        label="Tax Rate %"
                        value={taxRate}
                        onChangeText={setTaxRate}
                        placeholder="18"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <ThemedInput
                        label="Unit"
                        value={unit}
                        onChangeText={setUnit}
                        placeholder="pcs"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedInput
                        label="Stock"
                        value={stock}
                        onChangeText={setStock}
                        placeholder="0"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  <ThemedInput
                    label="HSN Code"
                    value={hsnCode}
                    onChangeText={setHsnCode}
                    placeholder="e.g. 8517"
                  />
                  <PrimaryButton
                    label={isLoading ? "Adding�" : "Add Product"}
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
    columns: { gap: 10, marginBottom: 10 },
    productCard: { flex: 1, padding: 14, gap: 6 },
    productIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(99,102,241,0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    productName: {
      ...Typography.label,
      color: T.text,
      fontWeight: "600",
      lineHeight: 18,
    },
    productPrice: { fontSize: 16, fontWeight: "700", color: T.primary },
    productMeta: { flexDirection: "row", gap: 6 },
    productUnit: {
      fontSize: 11,
      color: T.textMuted,
      backgroundColor: T.background,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    productTax: { fontSize: 11, color: T.textMuted },
    stockBadge: {
      backgroundColor: "rgba(16,185,129,0.15)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    stockLow: { backgroundColor: "rgba(239,68,68,0.15)" },
    stockText: { fontSize: 11, color: T.success, fontWeight: "600" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalCard: { margin: 12 },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    modalTitle: { ...Typography.h3, color: T.text },
  });
}
