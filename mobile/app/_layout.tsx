import { Stack } from "expo-router";
import "../global.css";
import { ClerkProvider } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import AuthSync from "@/components/AuthSync";
import PushNotificationManager from "@/components/PushNotificationManager";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import SocketConnection from "@/components/SocketConnection";
import { SafeAreaProvider } from "react-native-safe-area-context";

Sentry.init({
  dsn: "https://6c998e045dea34a424b5cdc8b375e6b4@o4509813037137920.ingest.de.sentry.io/4510696586477648",
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.reactNativeTracingIntegration({
      traceFetch: true,
      traceXHR: true,
      enableHTTPTimings: true,
    }),
  ],
});

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <Sentry.ErrorBoundary>
            <StatusBar style="light" />
            <AuthSync />
            <PushNotificationManager />
            <SocketConnection />
            <Stack screenOptions={{ headerShown: false }} />
          </Sentry.ErrorBoundary>
        </QueryClientProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
};
