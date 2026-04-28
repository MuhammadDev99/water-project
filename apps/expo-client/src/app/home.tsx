import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { authClient } from "~/utils/auth";

export default function Home() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome Home, {session?.user.name}!
      </Text>
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF", // Use your theme background
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#09090B",
  },
  logoutButton: {
    backgroundColor: "#ef4444", // Destructive red
    marginTop: 24,
    width: "100%",
    borderRadius: 8,
    padding: 16,
  },
  logoutButtonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
