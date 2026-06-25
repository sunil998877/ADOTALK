import UserItem from "@/components/UserItem";
import { useGetOrCreateChat } from "@/hooks/useChats";
import { useUsers } from "@/hooks/useUsers";
import { useSocketStore } from "@/lib/socket";
import { getChatHref } from "@/lib/chat-navigation";
import { User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NewChatScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers, isLoading } = useUsers();
  const { mutate: getOrCreateChat, isPending: isCreatingChat } = useGetOrCreateChat();
  const { onlineUsers } = useSocketStore();

  const users = allUsers?.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
  });

  const handleUserSelect = (user: User) => {
    getOrCreateChat(user._id, {
      onSuccess: (chat) => {
        router.dismiss();
        setTimeout(() => {
          router.push(getChatHref(chat));
        }, 100);
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-black/60" edges={["top"]}>
      <View className="flex-1 justify-end">
        <View className="bg-surface rounded-t-[28px] h-[92%] overflow-hidden border-t border-surface-light">
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-surface-light" />
          </View>

          <View className="px-5 pb-4 pt-2 flex-row items-center">
            <Pressable
              className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-surface-card border border-surface-light active:opacity-80"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={20} color="#F4A261" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-foreground text-xl font-bold">New Chat</Text>
              <Text className="text-muted-foreground text-sm mt-0.5">
                Pick someone to message
              </Text>
            </View>
          </View>

          <View className="px-5 pb-3">
            <View className="flex-row items-center bg-surface-card rounded-2xl px-4 py-3 gap-2 border border-surface-light">
              <Ionicons name="search" size={18} color="#6B6B70" />
              <TextInput
                placeholder="Search by name or email"
                placeholderTextColor="#6B6B70"
                className="flex-1 text-foreground text-[15px]"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#6B6B70" />
                </Pressable>
              )}
            </View>
          </View>

          <View className="flex-1 px-4">
            {isCreatingChat || isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#F4A261" />
              </View>
            ) : !users || users.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="w-16 h-16 rounded-2xl bg-surface-card items-center justify-center mb-4">
                  <Ionicons name="person-outline" size={32} color="#6B6B70" />
                </View>
                <Text className="text-foreground text-lg font-semibold">No users found</Text>
                <Text className="text-muted-foreground text-sm mt-2 text-center">
                  Try a different search term
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
              >
                <Text className="text-subtle-foreground text-xs font-semibold uppercase tracking-wider mb-3 px-1">
                  People ({users.length})
                </Text>
                {users.map((user) => (
                  <UserItem
                    key={user._id}
                    user={user}
                    isOnline={onlineUsers.has(user._id)}
                    onPress={() => handleUserSelect(user)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NewChatScreen;
