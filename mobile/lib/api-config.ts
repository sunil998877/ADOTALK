import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_BASE_URL = "https://adotalk-1.onrender.com";

function getDevServerHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") return host;
  }

  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  return DEFAULT_API_BASE_URL;
}

export const API_URL = `${getApiBaseUrl()}/api`;
export const SOCKET_URL = getApiBaseUrl();
