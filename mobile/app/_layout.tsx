import { Stack } from "expo-router";
import "../global.css";
import { ClerkProvider } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import AuthSync from "@/components/AuthSync";
import PushNotificationManager from "@/components/PushNotificationManager";
import { StatusBar } from "expo-status-bar";
import SocketConnection from "@/components/SocketConnection";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AuthSync />
          <PushNotificationManager />
          <SocketConnection />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
};
