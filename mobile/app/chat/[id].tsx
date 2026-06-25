import EmptyUI from "@/components/EmptyUI";
import MessageBubble from "@/components/MessageBubble";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useSocketStore } from "@/lib/socket";
import { getCallMeetingUrl } from "@/lib/media";
import { MessageSender } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveObjectId } from "@/lib/object-id";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";



type ChatParams = {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
  participantEmail?: string;
};

const ChatDetailScreen = () => {
  const params = useLocalSearchParams<ChatParams>();
  const pathname = usePathname();
  const chatId = resolveObjectId(params.id, pathname.split("/").pop());
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const participantId = Array.isArray(params.participantId)
    ? params.participantId[0]
    : params.participantId;

  useEffect(() => {
    if (!chatId) {
      router.replace("/(tabs)");
    }
  }, [chatId]);

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(chatId);
  const { mutateAsync: uploadImage, isPending: isUploadingImage } = useUploadImage();

  const { joinChat, leaveChat, sendMessage, sendTyping, isConnected, onlineUsers, typingUsers } =
    useSocketStore();

  const isOnline = participantId ? onlineUsers.has(participantId) : false;
  const isTyping = chatId ? typingUsers.get(chatId) === participantId : false;

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // join chat room on mount, leave on unmount
  useEffect(() => {
    if (chatId && isConnected) joinChat(chatId);

    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [chatId, isConnected, joinChat, leaveChat]);

  const scrollToEnd = useCallback((animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 50);
  }, []);

  // scroll when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToEnd();
    }
  }, [messages, scrollToEnd]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const showSub = Keyboard.addListener(showEvent, () => scrollToEnd());
    return () => showSub.remove();
  }, [scrollToEnd]);

  const handleTyping = useCallback(
    (text: string) => {
      setMessageText(text);

      if (!isConnected || !chatId) return;

      // send typing start
      if (text.length > 0) {
        sendTyping(chatId, true);

        // clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // stop typing after 2 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(chatId, false);
        }, 2000);
      } else {
        // text cleared, stop typing
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        sendTyping(chatId, false);
      }
    },
    [chatId, isConnected, sendTyping]
  );

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handlePickImage = async () => {
    if (!chatId || !currentUser || !isConnected || isSending || isUploadingImage) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow photo library access to send images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const base64Image = `data:${mimeType};base64,${asset.base64}`;

    setPendingImage({ uri: asset.uri, base64: base64Image });
    scrollToEnd();
  };

  const handleClearPendingImage = () => {
    setPendingImage(null);
  };

  const handleSendImage = async () => {
    if (!pendingImage || !chatId || !currentUser || !isConnected || isUploadingImage) return;

    setIsSending(true);
    try {
      const imageUrl = await uploadImage(pendingImage.base64);
      const caption = messageText.trim();
      sendMessage(chatId, caption, {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
      }, imageUrl);
      setPendingImage(null);
      setMessageText("");
      scrollToEnd();
    } catch {
      Alert.alert("Upload failed", "Could not send image. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleStartCall = (withVideo: boolean) => {
    if (!chatId || !name) return;

    const url = getCallMeetingUrl(chatId, withVideo);
    const callType = withVideo ? "video" : "voice";

    Alert.alert(
      withVideo ? "Video call" : "Voice call",
      `Start a ${callType} call with ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: async () => {
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) {
              Alert.alert("Unable to start call", "Could not open the call link on this device.");
              return;
            }
            Linking.openURL(url);
          },
        },
      ]
    );
  };

  const handleSend = () => {
    if (pendingImage) {
      void handleSendImage();
      return;
    }

    if (!messageText.trim() || isSending || !isConnected || !currentUser || !chatId) return;

    // stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(chatId, false);

    setIsSending(true);
    sendMessage(chatId, messageText.trim(), {
      _id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
    });
    setMessageText("");
    setIsSending(false);

    scrollToEnd();
  };

  const canSend =
    Boolean(pendingImage || messageText.trim()) && !isSending && !isUploadingImage && isConnected;

  if (!chatId) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#F4A261" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121214]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-surface border-b border-surface-light">
        <Pressable
          onPress={handleGoBack}
          className="w-10 h-10 rounded-full bg-surface-card items-center justify-center active:opacity-80"
        >
          <Ionicons name="arrow-back" size={22} color="#F4A261" />
        </Pressable>
        <View className="flex-row items-center flex-1 ml-3">
          <View className="relative">
            {avatar && (
              <Image
                source={avatar}
                style={{ width: 42, height: 42, borderRadius: 21 }}
                contentFit="cover"
              />
            )}
            {isOnline && (
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface" />
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-foreground font-semibold text-base" numberOfLines={1}>
              {name}
            </Text>
            <Text className={`text-xs mt-0.5 ${isTyping ? "text-primary" : "text-muted-foreground"}`}>
              {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            className="w-10 h-10 rounded-full bg-surface-card items-center justify-center active:opacity-80"
            onPress={() => handleStartCall(false)}
            accessibilityRole="button"
            accessibilityLabel="Voice call"
          >
            <Ionicons name="call-outline" size={18} color="#F4A261" />
          </Pressable>
          <Pressable
            className="w-10 h-10 rounded-full bg-surface-card items-center justify-center active:opacity-80"
            onPress={() => handleStartCall(true)}
            accessibilityRole="button"
            accessibilityLabel="Video call"
          >
            <Ionicons name="videocam-outline" size={18} color="#F4A261" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Messages area */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F4A261" />
          </View>
        ) : !messages || messages.length === 0 ? (
          <View className="flex-1">
            <EmptyUI
              title="No messages yet"
              subtitle="Start the conversation!"
              iconName="chatbubbles-outline"
              iconColor="#6B6B70"
              iconSize={64}
            />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: 8,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => scrollToEnd(false)}
          >
            {messages.map((message) => {
              const senderId = (message.sender as MessageSender)._id;
              const isFromMe = currentUser ? senderId === currentUser._id : false;

              return <MessageBubble key={message._id} message={message} isFromMe={isFromMe} />;
            })}
          </ScrollView>
        )}

        {/* Composer — normal flow, sits above keyboard automatically */}
        <View className="bg-[#121214]" style={{ paddingBottom: 4, paddingTop: 4 }}>
          {pendingImage ? (
            <View className="px-3 pb-2">
              <View className="flex-row items-start gap-3 bg-[#1F2C34] rounded-3xl px-3 py-3">
                <View className="relative">
                  <Image
                    source={{ uri: pendingImage.uri }}
                    style={{ width: 72, height: 72, borderRadius: 12 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={handleClearPendingImage}
                    disabled={isUploadingImage}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#2A2A2E] items-center justify-center border border-[#3A3A3E]"
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                  >
                    <Ionicons name="close" size={16} color="#E8E8EA" />
                  </Pressable>
                </View>
                <View className="flex-1 pt-1">
                  <Text className="text-foreground text-sm font-medium">Photo selected</Text>
                  <Text className="text-[#9FB0B8] text-xs mt-1">
                    Add a caption (optional) and tap send
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View className="flex-row items-end gap-2 px-2">
            <Pressable
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-80 mb-1"
              onPress={handlePickImage}
              disabled={isSending || isUploadingImage || !isConnected}
              accessibilityRole="button"
              accessibilityLabel="Attach photo"
            >
              <Ionicons name="add" size={26} color="#8696A0" />
            </Pressable>

            <View className="flex-1 flex-row items-end bg-[#1F2C34] rounded-[26px] px-4 py-1 min-h-[48px]">
              <TextInput
                placeholder={pendingImage ? "Add a caption..." : "Message"}
                placeholderTextColor="#8696A0"
                className="flex-1 text-foreground text-[16px]"
                multiline
                style={{
                  maxHeight: 120,
                  minHeight: 38,
                  paddingTop: Platform.OS === "ios" ? 9 : 7,
                  paddingBottom: Platform.OS === "ios" ? 9 : 7,
                }}
                value={messageText}
                onChangeText={handleTyping}
                onSubmitEditing={handleSend}
                editable={!isSending && !isUploadingImage}
                onFocus={() => scrollToEnd()}
              />
            </View>

            <Pressable
              className={`w-12 h-12 rounded-full items-center justify-center mb-0.5 ${
                canSend ? "bg-primary" : "bg-[#23323A]"
              }`}
              onPress={handleSend}
              disabled={!canSend}
            >
              {isSending || isUploadingImage ? (
                <ActivityIndicator size="small" color="#0D0D0F" />
              ) : (
                <Ionicons name="send" size={18} color={canSend ? "#0D0D0F" : "#8696A0"} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;
