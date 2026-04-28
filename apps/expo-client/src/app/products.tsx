import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function ProductListScreen() {
  // Use the trpc proxy to get query options
  const {
    data: products,
    isLoading,
    error,
  } = useQuery(trpc.product.getProducts.queryOptions());

  if (isLoading) return <ActivityIndicator className="mt-10" />;

  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className="bg-background flex-1 p-4">
      <Text className="mb-4 text-2xl font-bold">Available Water</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-card border-border mb-2 rounded-lg border p-4">
            <Text className="text-foreground text-lg font-bold">
              {item.name}
            </Text>
            <Text className="text-muted-foreground">{item.description}</Text>
            <Text className="text-primary mt-2 font-bold">
              {item.price} SAR
            </Text>
          </View>
        )}
      />
    </View>
  );
}
