import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";
import { Chat, Message, MessageSender } from "@/types";
import { SOCKET_URL } from "./api-config";
import { isValidObjectId } from "./object-id";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>;
  unreadChats: Set<string>;
  currentChatId: string | null;
  queryClient: QueryClient | null;

  connect: (token: string, queryClient: QueryClient) => void;
  disconnect: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, text: string, currentUser: MessageSender, imageUrl?: string) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  unreadChats: new Set(),
  currentChatId: null,
  queryClient: null,

  connect: (token, queryClient) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    if (existingSocket) existingSocket.disconnect();

    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on("connect", () => {
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("online-users", ({ userIds }: { userIds: string[] }) => {
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }: { userId: string }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
      }));
    });

    socket.on("user-offline", ({ userId }: { userId: string }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers };
      });
    });

    socket.on("socket-error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
    });

    socket.on("new-message", (message: Message) => {
      const senderId = (message.sender as MessageSender)._id;
      const { currentChatId } = get();

      queryClient.setQueryData<Message[]>(["messages", message.chat], (old) => {
        if (!old) return [message];
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        if (filtered.some((m) => m._id === message._id)) return filtered;
        return [...filtered, message];
      });

      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        return oldChats?.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                text: message.text || (message.messageType === "image" ? "Photo" : ""),
                messageType: message.messageType,
                imageUrl: message.imageUrl,
                sender: senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
            };
          }
          return chat;
        });
      });

      if (currentChatId !== message.chat) {
        const chats = queryClient.getQueryData<Chat[]>(["chats"]);
        const chat = chats?.find((c) => c._id === message.chat);
        if (chat?.participant && senderId === chat.participant._id) {
          set((state) => ({
            unreadChats: new Set([...state.unreadChats, message.chat]),
          }));
        }
      }

      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers };
      });
    });

    socket.on(
      "typing",
      ({ userId, chatId, isTyping }: { userId: string; chatId: string; isTyping: boolean }) => {
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          if (isTyping) typingUsers.set(chatId, userId);
          else typingUsers.delete(chatId);
          return { typingUsers };
        });
      }
    );

    set({ socket, queryClient });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        onlineUsers: new Set(),
        typingUsers: new Map(),
        unreadChats: new Set(),
        currentChatId: null,
        queryClient: null,
      });
    }
  },

  joinChat: (chatId) => {
    const socket = get().socket;
    set((state) => {
      const unreadChats = new Set(state.unreadChats);
      unreadChats.delete(chatId);
      return { currentChatId: chatId, unreadChats };
    });

    if (socket?.connected) {
      socket.emit("join-chat", chatId);
    }
  },

  leaveChat: (chatId) => {
    const { socket } = get();
    set({ currentChatId: null });
    if (socket?.connected) {
      socket.emit("leave-chat", chatId);
    }
  },

  sendMessage: (chatId, text, currentUser, imageUrl) => {
    const { socket, queryClient } = get();
    if (!socket?.connected || !queryClient || !isValidObjectId(chatId)) return;
    if (!text.trim() && !imageUrl) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      chat: chatId,
      sender: currentUser,
      text,
      messageType: imageUrl ? "image" : "text",
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
      if (!old) return [optimisticMessage];
      return [...old, optimisticMessage];
    });

    socket.emit("send-message", { chatId, text, imageUrl });

    const errorHandler = (error: { message: string }) => {
      console.error("Failed to send message:", error.message);
      queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });
      socket.off("socket-error", errorHandler);
    };

    socket.once("socket-error", errorHandler);
  },

  sendTyping: (chatId, isTyping) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit("typing", { chatId, isTyping });
    }
  },
}));
