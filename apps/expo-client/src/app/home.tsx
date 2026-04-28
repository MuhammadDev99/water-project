import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { authClient } from "~/utils/auth";

export default function Home() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.replace("/"); // Go back to login
  };

  return (
    <SafeAreaView className="bg-background flex-1 items-center justify-center p-6">
      <Text className="text-foreground text-2xl font-bold">
        Welcome Home, {session?.user.name}!
      </Text>
      <Pressable
        className="bg-destructive mt-6 w-full rounded-lg p-4"
        onPress={handleLogout}
      >
        <Text className="text-center font-bold text-white">Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
}
