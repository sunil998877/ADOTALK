import { formatTime } from "../lib/utils";
import { resolveMediaUrl } from "../lib/media";

export function MessageBubble({ message, currentUser }) {
  const isMe = message.sender?._id === currentUser?._id;
  const isImage = message.messageType === "image" && message.imageUrl;
  const imageSrc = resolveMediaUrl(message.imageUrl);

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl overflow-hidden ${
            isMe
              ? "bg-linear-to-r from-amber-500 to-orange-500 text-primary-content"
              : "bg-base-300/40 text-base-content"
          }`}
        >
          {isImage && imageSrc ? (
            <a href={imageSrc} target="_blank" rel="noreferrer">
              <img
                src={imageSrc}
                alt="Shared image"
                className="max-w-xs max-h-80 w-full object-cover"
              />
            </a>
          ) : null}
          {message.text ? (
            <p className={`text-sm px-4 py-2.5 ${isImage ? "pt-2" : ""}`}>{message.text}</p>
          ) : null}
        </div>
        <p className={`text-xs mt-1 mx-1 ${isMe ? "text-base-content/60" : "text-base-content/50"}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
