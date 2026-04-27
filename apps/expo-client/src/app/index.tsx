import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authClient } from "~/utils/auth";

export default function Index() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { data: session, isPending } = authClient.useSession();

  const handleAuth = async () => {
    if (isLogin) {
      await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onError: (ctx) => Alert.alert("Login Failed", ctx.error.message),
        },
      );
    } else {
      await authClient.signUp.email(
        {
          email,
          password,
          name,
        },
        {
          onError: (ctx) =>
            Alert.alert("Registration Failed", ctx.error.message),
        },
      );
    }
  };

  if (isPending)
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );

  if (session) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center p-6">
        <Text className="text-foreground text-2xl font-bold">
          Welcome, {session.user.name}!
        </Text>
        <Text className="text-muted-foreground mb-6">{session.user.email}</Text>

        <Pressable
          className="bg-destructive w-full rounded-lg p-4"
          onPress={() => authClient.signOut()}
        >
          <Text className="text-center text-lg font-bold text-white">
            Logout
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1 justify-center p-6">
      <Text className="text-foreground mb-2 text-center text-4xl font-bold">
        Water Delivery
      </Text>
      <Text className="text-muted-foreground mb-8 text-center text-xl font-semibold">
        {isLogin ? "Sign In" : "Create Account"}
      </Text>

      {!isLogin && (
        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#A1A1AA"
          className="border-border bg-card text-foreground mb-4 rounded-lg border p-4"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#A1A1AA"
        className="border-border bg-card text-foreground mb-4 rounded-lg border p-4"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#A1A1AA"
        className="border-border bg-card text-foreground mb-6 rounded-lg border p-4"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        className="bg-primary rounded-lg p-4 active:opacity-80"
        onPress={handleAuth}
      >
        <Text className="text-primary-foreground text-center text-lg font-bold">
          {isLogin ? "Login" : "Register"}
        </Text>
      </Pressable>

      <Pressable onPress={() => setIsLogin(!isLogin)} className="mt-6">
        <Text className="text-primary text-center font-medium">
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
