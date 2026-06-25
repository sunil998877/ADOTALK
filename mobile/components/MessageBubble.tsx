import { Message } from "@/types";
import { resolveMediaUrl } from "@/lib/media";
import { Image } from "expo-image";
import { View, Text, ActivityIndicator } from "react-native";
import { format } from "date-fns";

function MessageBubble({ message, isFromMe }: { message: Message; isFromMe: boolean }) {
  const isImage = message.messageType === "image" && message.imageUrl;
  const imageUri = resolveMediaUrl(message.imageUrl);
  const isPending = message._id.startsWith("temp-");
  const time = format(new Date(message.createdAt), "h:mm a");

  return (
    <View className={`flex-row ${isFromMe ? "justify-end" : "justify-start"} mb-1`}>
      <View className={`max-w-[82%] ${isFromMe ? "items-end" : "items-start"}`}>
        <View
          className={`rounded-2xl overflow-hidden ${
            isFromMe
              ? "bg-primary rounded-br-md"
              : "bg-surface-card rounded-bl-md border border-surface-light"
          } ${isPending ? "opacity-80" : ""}`}
        >
          {isImage && imageUri ? (
            <View className="relative">
              <Image
                source={{ uri: imageUri }}
                style={{ width: 240, height: 240 }}
                contentFit="cover"
              />
              {isPending ? (
                <View className="absolute inset-0 bg-black/35 items-center justify-center">
                  <ActivityIndicator size="small" color="#F4A261" />
                </View>
              ) : null}
            </View>
          ) : null}
          {message.text ? (
            <Text
              className={`text-[15px] leading-5 px-3.5 py-2.5 ${
                isFromMe ? "text-surface-dark" : "text-foreground"
              } ${isImage ? "pt-2" : ""}`}
            >
              {message.text}
            </Text>
          ) : null}
        </View>
        <Text className="text-[10px] text-subtle-foreground mt-1 mx-1">
          {isPending ? "Sending..." : time}
        </Text>
      </View>
    </View>
  );
}

export default MessageBubble;
