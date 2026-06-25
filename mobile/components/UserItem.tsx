import type { User } from "@/types";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type UserItemProps = {
  user: User;
  isOnline: boolean;
  onPress: () => void;
};

function UserItem({ user, isOnline, onPress }: UserItemProps) {
  return (
    <Pressable
      className="flex-row items-center p-3 mb-2 bg-surface-card rounded-2xl border border-surface-light active:opacity-80"
      onPress={onPress}
    >
      <View className="relative">
        <Image
          source={{ uri: user.avatar }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
        {isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface-card" />
        )}
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
            {user.name}
          </Text>
          {isOnline && (
            <View className="flex-row items-center gap-1 bg-green-500/15 px-2 py-0.5 rounded-full">
              <View className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <Text className="text-[10px] text-green-500 font-medium">Online</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
          {user.email}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#6B6B70" />
    </Pressable>
  );
}

export default UserItem;
