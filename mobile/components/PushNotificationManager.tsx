import { useApi } from "@/lib/axios";
import { registerForPushNotificationsAsync } from "@/lib/notifications";
import { useAuth } from "@clerk/clerk-expo";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useRef } from "react";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const PushNotificationManager = () => {
  const { isSignedIn } = useAuth();
  const { apiWithAuth } = useApi();
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (isExpoGo) return;

    const setupPushNotifications = async () => {
      if (!isSignedIn || hasRegistered.current) return;

      try {
        const pushToken = await registerForPushNotificationsAsync();
        await apiWithAuth({
          method: "PUT",
          url: "/users/push-token",
          data: { pushToken },
        });
        hasRegistered.current = true;
      } catch (error) {
        console.log("Push notification setup skipped:", error);
      }
    };

    void setupPushNotifications();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");

    const notificationSubscription = Notifications.addNotificationReceivedListener(() => {});

    return () => {
      notificationSubscription.remove();
      if (!isSignedIn) {
        hasRegistered.current = false;
      }
    };
  }, [apiWithAuth, isSignedIn]);

  return null;
};

export default PushNotificationManager;
