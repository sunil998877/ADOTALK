import { useAuthCallback } from "@/hooks/useAuth";
import { warmUpApi } from "@/lib/axios";
import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";

const MAX_SYNC_RETRIES = 3;

const AuthSync = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { mutate: syncUser } = useAuthCallback();
  const hasSynced = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearRetry = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    const currentUserId = user?.id;

    const runSync = async () => {
      if (!currentUserId) return;
      hasSynced.current = true;

      try {
        await warmUpApi();
      } catch {}

      syncUser(undefined, {
        onSuccess: (data) => {
          clearRetry();
          retryCountRef.current = 0;
          console.log("✅ User synced with backend:", data.name);
          Sentry.logger.info(Sentry.logger.fmt`User synced with backend: ${data.name}`, {
            userId: currentUserId,
            userName: data.name,
          });
        },
        onError: (error) => {
          hasSynced.current = false;
          const nextRetryCount = retryCountRef.current + 1;
          retryCountRef.current = nextRetryCount;

          Sentry.logger.error("Failed to sync user with backend", {
            userId: currentUserId,
            error: error instanceof Error ? error.message : String(error),
            retryCount: nextRetryCount,
          });

          if (nextRetryCount <= MAX_SYNC_RETRIES && isSignedIn) {
            const delayMs = nextRetryCount * 2000;
            console.log(`Retrying user sync in ${delayMs / 1000}s...`);
            clearRetry();
            retryTimeoutRef.current = setTimeout(() => {
              void runSync();
            }, delayMs);
            return;
          }

          console.log("❌ User sync failed for the user:", error);
        },
      });
    };

    if (isSignedIn && user && !hasSynced.current) {
      void runSync();
    }

    if (!isSignedIn) {
      clearRetry();
      hasSynced.current = false;
      retryCountRef.current = 0;
    }

    return () => {
      clearRetry();
    };
  }, [isSignedIn, user, syncUser]);

  return null;
};

export default AuthSync;
