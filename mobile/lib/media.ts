import { getApiBaseUrl } from "./api-config";

export function resolveMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (
    url.startsWith("http") ||
    url.startsWith("data:") ||
    url.startsWith("file://") ||
    url.startsWith("content://")
  ) {
    return url;
  }
  return `${getApiBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

export function getCallMeetingUrl(chatId: string, withVideo = true): string {
  const room = `adotalk-${chatId}`;
  return withVideo
    ? `https://meet.jit.si/${room}`
    : `https://meet.jit.si/${room}#config.startWithVideoMuted=true`;
}
