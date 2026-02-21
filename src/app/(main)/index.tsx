import { ThemedButton } from "@/src/components/ThemedButton";
import { useAuthStore } from "@/src/store/authStore";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Welcome {user?.name}</Text>
      <ThemedButton title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
