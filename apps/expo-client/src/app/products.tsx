import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function ProductListScreen() {
  const {
    data: products,
    isLoading,
    error,
  } = useQuery(trpc.product.getProducts.queryOptions());

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Water</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productDescription}>{item.description}</Text>
            <Text style={styles.productPrice}>{item.price} SAR</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  header: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  productName: {
    color: "#09090B",
    fontSize: 18,
    fontWeight: "bold",
  },
  productDescription: {
    color: "#71717A",
  },
  productPrice: {
    color: "#c03484",
    marginTop: 8,
    fontWeight: "bold",
  },
});
