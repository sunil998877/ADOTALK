import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Types } from "mongoose";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { User } from "../models/User";
import { sendPushNotifications } from "./pushNotifications";

export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:8081",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      const clerkId = session.sub;
      const user = await User.findOne({ clerkId });
      if (!user) return next(new Error("User not found"));
      socket.data.userId = user._id.toString();
      next();
    } catch (error: any) {
      next(new Error(error));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("user-online", { userId });
    socket.join(`user:${userId}`);

    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("send-message", async (data: { chatId: string; text?: string; imageUrl?: string }) => {
      try {
        const { chatId, text, imageUrl } = data;
        const trimmedText = text?.trim() ?? "";
        const trimmedImageUrl = imageUrl?.trim() ?? "";

        if (!Types.ObjectId.isValid(chatId)) {
          socket.emit("socket-error", { message: "Invalid chat ID" });
          return;
        }

        if (!trimmedText && !trimmedImageUrl) {
          socket.emit("socket-error", { message: "Message cannot be empty" });
          return;
        }

        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });

        if (!chat) {
          socket.emit("socket-error", { message: "Chat not found" });
          return;
        }

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          text: trimmedText,
          messageType: trimmedImageUrl ? "image" : "text",
          imageUrl: trimmedImageUrl,
        });

        chat.lastMessage = message._id;
        chat.lastMessageAt = new Date();
        await chat.save();

        await message.populate("sender", "name avatar");

        io.to(`chat:${chatId}`).emit("new-message", message);

        for (const participantId of chat.participants) {
          io.to(`user:${participantId}`).emit("new-message", message);
        }

        const recipientIds = chat.participants
          .map((participantId) => participantId.toString())
          .filter((participantId) => participantId !== userId);

        if (recipientIds.length > 0) {
          const recipients = await User.find({
            _id: { $in: recipientIds },
            pushToken: { $exists: true, $ne: "" },
          }).select("pushToken name");

          const sender = await User.findById(userId).select("name");
          const senderName = sender?.name ?? "New message";
          const notificationBody = trimmedText || (trimmedImageUrl ? "Photo" : "You received a message");

          await sendPushNotifications(
            recipients
              .filter((recipient) => typeof recipient.pushToken === "string" && recipient.pushToken.trim())
              .map((recipient) => ({
                to: recipient.pushToken!.trim(),
                title: senderName,
                body: notificationBody,
                sound: "default" as const,
                data: {
                  chatId,
                  senderName,
                },
              }))
          );
        }
      } catch (error) {
        console.error("send-message error:", error);
        socket.emit("socket-error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
      const typingPayload = {
        userId,
        chatId: data.chatId,
        isTyping: data.isTyping,
      };

      socket.to(`chat:${data.chatId}`).emit("typing", typingPayload);

      try {
        const chat = await Chat.findById(data.chatId);
        if (chat) {
          const otherParticipantId = chat.participants.find((p: any) => p.toString() !== userId);
          if (otherParticipantId) {
            socket.to(`user:${otherParticipantId}`).emit("typing", typingPayload);
          }
        }
      } catch (error) {}
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};
