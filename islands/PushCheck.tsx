import { SubscriptionChangeEvent } from "@models/onesignal.d.ts";
import ky from "ky";
import { useEffect } from "preact/hooks";

/** Onesignal push notification manager */
export const PushCheck = () => {
  /** Handles the onesignal/DenoKv sync of the current users push opt. */
  const handleSetPush = (enablePush: boolean) => {
    if (!globalThis?.OneSignal || !globalThis?.OneSignalDeferred) return;

    globalThis.OneSignalDeferred.push(async function (OneSignal) {
      if (
        !OneSignal.User.externalId ||
        OneSignal.User.PushSubscription.optedIn !== enablePush ||
        (enablePush && !OneSignal.Notifications.permission)
      ) {
        return;
      }

      await ky.put("/api/settings/opt", {
        json: { onesignal_id: OneSignal.User.externalId, push: enablePush },
      });
    });
  };

  const handleOnPushChange = (event: SubscriptionChangeEvent) => handleSetPush(event.current.optedIn);

  useEffect(() => {
    if (!globalThis?.OneSignalDeferred) globalThis.OneSignalDeferred = [];

    globalThis.OneSignalDeferred.push(function (OneSignal) {
      OneSignal.User.PushSubscription.addEventListener("change", handleOnPushChange);
    });

    return () => {
      if (!globalThis?.OneSignal) return;
      globalThis.OneSignal.User?.PushSubscription?.removeEventListener("change", handleOnPushChange);
    };
  }, []);

  return null;
};
