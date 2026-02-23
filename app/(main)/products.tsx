import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedButton } from "@/src/components/ThemedButton";
import { ThemedInput } from "@/src/components/ThemedInput";
import { useBusinessStore } from "@/src/store/businessStore";
import { useProductStore } from "@/src/store/productStore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProductsScreen() {
  const bgColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const isDark = bgColor !== "#fff";

  const { products, fetchProducts, addProduct, isLoading } = useProductStore();
  const { currentBusiness } = useBusinessStore();

  const [isModalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [taxRate, setTaxRate] = useState("");

  useEffect(() => {
    if (currentBusiness?.$id) {
      fetchProducts(currentBusiness.$id);
    }
  }, [currentBusiness?.$id]);

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !currentBusiness?.$id) return;

    await addProduct({
      name,
      description,
      price: parseFloat(price) || 0,
      hsnCode,
      taxRate: parseFloat(taxRate) || 0,
      businessId: currentBusiness.$id,
    });

    setModalVisible(false);
    setName("");
    setDescription("");
    setPrice("");
    setHsnCode("");
    setTaxRate("");
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View
      style={[
        styles.productCard,
        { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
      ]}
    >
      <View style={styles.productHeader}>
        <View style={[styles.iconBox, { backgroundColor: "#0a7ea420" }]}>
          <IconSymbol name="cube.box.fill" size={24} color="#0a7ea4" />
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: textColor }]}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
        </View>
        {item.syncStatus === "pending" && (
          <IconSymbol
            name="arrow.triangle.2.circlepath"
            size={16}
            color="#f59e0b"
          />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Products</Text>
      </View>

      {isLoading && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? "#1e1e1e" : "#f8f9fa" },
            ]}
          >
            <IconSymbol name="cart.fill" size={48} color="#0a7ea4" />
          </View>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No Products Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: textSecondaryColor }]}>
            Add items to your inventory to quickly add them to invoices.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.$id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: bgColor }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              New Product
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <IconSymbol name="xmark" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedInput
              placeholder="Product Name *"
              value={name}
              onChangeText={setName}
            />
            <ThemedInput
              placeholder="Price (₹) *"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
            <ThemedInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.row}>
              <View style={styles.flex1}>
                <ThemedInput
                  placeholder="HSN/SAC Code"
                  value={hsnCode}
                  onChangeText={setHsnCode}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <ThemedInput
                  placeholder="Tax Rate (%)"
                  value={taxRate}
                  onChangeText={setTaxRate}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <ThemedButton
              title="Save Product"
              onPress={handleAddProduct}
              isLoading={isLoading}
              style={styles.saveButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  productCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: "#0a7ea4",
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingBottom: 100,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    bottom: 100, // Above tab bar
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 24 : 48,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  modalContent: {
    padding: 24,
  },
  row: {
    flexDirection: "row",
  },
  flex1: {
    flex: 1,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 48,
  },
});
