import { useAuthCallback } from "@/hooks/useAuth";
import { warmUpApi } from "@/lib/axios";
import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";

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
          console.log("User synced:", data.name);
        },
        onError: (error) => {
          hasSynced.current = false;
          const nextRetryCount = retryCountRef.current + 1;
          retryCountRef.current = nextRetryCount;

          if (nextRetryCount <= MAX_SYNC_RETRIES && isSignedIn) {
            const delayMs = nextRetryCount * 2000;
            clearRetry();
            retryTimeoutRef.current = setTimeout(() => {
              void runSync();
            }, delayMs);
            return;
          }

          console.error("User sync failed:", error);
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
