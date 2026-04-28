import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { authClient } from "~/utils/auth";

export default function Index() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) router.replace("/home");
  }, [session, router]);

  const handleAuth = async () => {
    const options = {
      onSuccess: () => router.replace("/home"),
      onError: (ctx: any) => Alert.alert("Error", ctx.error.message),
    };

    if (isLogin) {
      await authClient.signIn.email({ email, password }, options);
    } else {
      await authClient.signUp.email({ email, password, name }, options);
    }
  };

  if (isPending) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Water Delivery</Text>
      <Text style={styles.subtitle}>
        {isLogin ? "Sign In" : "Create Account"}
      </Text>

      {!isLogin && (
        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#A1A1AA"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#A1A1AA"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#A1A1AA"
        style={[styles.input, { marginBottom: 24 }]}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryButton} onPress={handleAuth}>
        <Text style={styles.primaryButtonText}>
          {isLogin ? "Login" : "Register"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setIsLogin(!isLogin)}
        style={styles.toggleContainer}
      >
        <Text style={styles.toggleText}>
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  center: {
    alignItems: "center",
  },
  title: {
    color: "#09090B",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 36,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#71717A",
    marginBottom: 32,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  input: {
    borderColor: "#E4E4E7",
    backgroundColor: "#FAFAFA",
    color: "#09090B",
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  primaryButton: {
    backgroundColor: "#c03484",
    borderRadius: 8,
    padding: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleContainer: {
    marginTop: 24,
  },
  toggleText: {
    color: "#c03484",
    textAlign: "center",
    fontWeight: "500",
  },
});
