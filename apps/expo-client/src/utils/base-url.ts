import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
export const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return "http://localhost:3001";
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0] ?? "127.0.0.1";

  return `http://${localhost}:3001`;
};
