import { Chat } from "@/types";
import { Image } from "expo-image";
import { View, Text, Pressable } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useSocketStore } from "@/lib/socket";

function getLastMessagePreview(chat: Chat) {
  const last = chat.lastMessage;
  if (!last) return "No messages yet";
  if (last.messageType === "image" || last.imageUrl) {
    return last.text?.trim() || "Photo";
  }
  return last.text || "No messages yet";
}

const ChatItem = ({ chat, onPress }: { chat: Chat; onPress: () => void }) => {
  const participant = chat.participant;
  const { onlineUsers, typingUsers, unreadChats } = useSocketStore();

  const isOnline = onlineUsers.has(participant._id);
  const isTyping = typingUsers.get(chat._id) === participant._id;
  const hasUnread = unreadChats.has(chat._id);
  const preview = getLastMessagePreview(chat);
  const isPhotoPreview = preview === "Photo";

  return (
    <Pressable
      className="flex-row items-center p-3 mb-2 bg-surface-card rounded-2xl border border-surface-light active:opacity-80"
      onPress={onPress}
    >
      <View className="relative">
        <Image
          source={participant.avatar}
          style={{ width: 54, height: 54, borderRadius: 27 }}
          contentFit="cover"
        />
        {isOnline && (
          <View className="absolute bottom-0 right-0 size-3.5 bg-green-500 rounded-full border-2 border-surface-card" />
        )}
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className={`text-base font-semibold flex-1 ${hasUnread ? "text-primary" : "text-foreground"}`}
            numberOfLines={1}
          >
            {participant.name}
          </Text>
          <Text className="text-[11px] text-subtle-foreground">
            {chat.lastMessageAt
              ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })
              : ""}
          </Text>
        </View>

        <View className="flex-row items-center mt-1 gap-1.5">
          {isTyping ? (
            <Text className="text-sm text-primary italic flex-1">typing...</Text>
          ) : (
            <>
              {isPhotoPreview && (
                <Ionicons name="image-outline" size={14} color={hasUnread ? "#F4A261" : "#6B6B70"} />
              )}
              <Text
                className={`text-sm flex-1 ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}
                numberOfLines={1}
              >
                {preview}
              </Text>
            </>
          )}
          {hasUnread && <View className="min-w-[20px] h-5 px-1.5 bg-primary rounded-full items-center justify-center">
            <Text className="text-[10px] font-bold text-surface-dark">1</Text>
          </View>}
        </View>
      </View>
    </Pressable>
  );
};

export default ChatItem;
