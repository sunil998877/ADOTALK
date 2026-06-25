const apiUrl = import.meta.env.VITE_API_URL;

export function resolveMediaUrl(url) {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (!apiUrl) return url;
  return `${apiUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function getMessagePreview(message) {
  if (message?.messageType === "image" || message?.imageUrl) {
    return message.text?.trim() ? message.text : "Photo";
  }
  return message?.text || "No messages yet";
}
