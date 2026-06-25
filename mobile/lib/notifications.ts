import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn("expo-notifications: could not set handler:", e);
  }
}

function hasGrantedPermission(result: unknown) {
  const permission = result as { granted?: boolean; status?: string };
  return permission.granted === true || permission.status === "granted";
}

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  );
}

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    throw new Error(
      "Push notifications are not supported in Expo Go (SDK 53+). Use a development build."
    );
  }

  if (!Device.isDevice) {
    throw new Error("Push notifications require a physical device.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require("expo-notifications") as typeof import("expo-notifications");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F4A261",
    });
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  let isGranted = hasGrantedPermission(existingPermissions);

  if (!isGranted) {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    isGranted = hasGrantedPermission(requestedPermissions);
  }

  if (!isGranted) {
    throw new Error("Notification permission not granted.");
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error("Missing EAS project ID for push notifications.");
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}
