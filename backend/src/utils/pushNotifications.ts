type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
};

function isExpoPushToken(token: string) {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

export async function sendPushNotifications(messages: ExpoPushMessage[]) {
  const validMessages = messages.filter((message) => isExpoPushToken(message.to));
  if (validMessages.length === 0) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validMessages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push request failed: ${response.status} ${text}`);
  }
}
