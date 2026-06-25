import type { Href } from "expo-router";
import type { Chat } from "@/types";

type ChatNavigationTarget = Pick<Chat, "_id"> & {
  participant: Pick<Chat["participant"], "_id" | "name" | "avatar" | "email">;
};

export function getChatHref(chat: ChatNavigationTarget): Href {
  return {
    pathname: "/chat/[id]",
    params: {
      id: chat._id,
      participantId: chat.participant._id,
      name: chat.participant.name,
      avatar: chat.participant.avatar,
      participantEmail: chat.participant.email,
    },
  };
}
