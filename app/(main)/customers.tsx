import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedButton } from "@/src/components/ThemedButton";
import { ThemedInput } from "@/src/components/ThemedInput";
import { useBusinessStore } from "@/src/store/businessStore";
import { useCustomerStore } from "@/src/store/customerStore";
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

export default function CustomersScreen() {
  const bgColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const isDark = bgColor !== "#fff";

  const { customers, fetchCustomers, addCustomer, isLoading } =
    useCustomerStore();
  const { currentBusiness } = useBusinessStore();

  const [isModalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");

  useEffect(() => {
    if (currentBusiness?.$id) {
      fetchCustomers(currentBusiness.$id);
    }
  }, [currentBusiness?.$id]);

  const handleAddCustomer = async () => {
    if (!name.trim() || !currentBusiness?.$id) return;

    await addCustomer({
      name,
      email,
      phone,
      address,
      gstin,
      businessId: currentBusiness.$id,
    });

    setModalVisible(false);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setGstin("");
  };

  const renderCustomer = ({ item }: { item: any }) => (
    <View
      style={[
        styles.customerCard,
        { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
      ]}
    >
      <View style={styles.customerHeader}>
        <View style={[styles.avatar, { backgroundColor: "#0a7ea420" }]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: textColor }]}>
            {item.name}
          </Text>
          {item.phone ? (
            <Text style={[styles.customerPhone, { color: textSecondaryColor }]}>
              {item.phone}
            </Text>
          ) : null}
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
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Customers
        </Text>
      </View>

      {isLoading && customers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? "#1e1e1e" : "#f8f9fa" },
            ]}
          >
            <IconSymbol name="person.2.fill" size={48} color="#0a7ea4" />
          </View>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No Customers Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: textSecondaryColor }]}>
            Add your first customer to start creating invoices for them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.$id}
          renderItem={renderCustomer}
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
              New Customer
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
              placeholder="Customer Name *"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <ThemedInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <ThemedInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <ThemedInput
              placeholder="Billing Address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
            <ThemedInput
              placeholder="GSTIN (Optional)"
              value={gstin}
              onChangeText={setGstin}
              autoCapitalize="characters"
            />

            <ThemedButton
              title="Save Customer"
              onPress={handleAddCustomer}
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
  customerCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0a7ea4",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: "#666",
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
  saveButton: {
    marginTop: 24,
    marginBottom: 48,
  },
});
