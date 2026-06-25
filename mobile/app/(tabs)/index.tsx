import ChatItem from "@/components/ChatItem";
import EmptyUI from "@/components/EmptyUI";
import { useChats } from "@/hooks/useChats";
import { getChatHref } from "@/lib/chat-navigation";
import { Chat } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ChatsTab = () => {
  const router = useRouter();
  const { data: chats, isLoading, error, refetch, isRefetching } = useChats();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-dark" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F4A261" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface-dark px-6" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <View className="w-16 h-16 rounded-2xl bg-red-500/10 items-center justify-center mb-4">
            <Ionicons name="cloud-offline-outline" size={32} color="#EF4444" />
          </View>
          <Text className="text-foreground text-lg font-semibold">Couldn&apos;t load chats</Text>
          <Text className="text-muted-foreground text-sm mt-2 text-center">
            Check your connection and try again
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-6 bg-primary px-6 py-3 rounded-full active:opacity-90"
          >
            <Text className="text-surface-dark font-semibold">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleChatPress = (chat: Chat) => {
    router.push(getChatHref(chat));
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={["top"]}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ChatItem chat={item} onPress={() => handleChatPress(item)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#F4A261"
            colors={["#F4A261"]}
          />
        }
        ListHeaderComponent={<Header chatCount={chats?.length ?? 0} />}
        ListEmptyComponent={
          <EmptyUI
            title="No chats yet"
            subtitle="Start a conversation and your messages will show up here."
            iconName="chatbubbles-outline"
            buttonLabel="Start New Chat"
            onPressButton={() => router.push("/new-chat")}
          />
        }
      />
    </SafeAreaView>
  );
};

export default ChatsTab;

function Header({ chatCount }: { chatCount: number }) {
  const router = useRouter();

  return (
    <View className="pt-2 pb-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-foreground">Chats</Text>
          <Text className="text-muted-foreground text-sm mt-1">
            {chatCount > 0 ? `${chatCount} conversation${chatCount === 1 ? "" : "s"}` : "Your messages"}
          </Text>
        </View>
        <Pressable
          className="size-11 bg-primary rounded-2xl items-center justify-center active:opacity-90"
          onPress={() => router.push("/new-chat")}
        >
          <Ionicons name="create-outline" size={22} color="#0D0D0F" />
        </Pressable>
      </View>
    </View>
  );
}
