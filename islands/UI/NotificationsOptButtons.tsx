import { IconCheck as Check } from "@icons";
import { ISettings } from "@models/App.ts";
import { IAuthenticatedUser } from "@models/User.ts";
import ky from "ky";
import { useEffect, useState } from "preact/hooks";

/** Push/Email notification settings component.
 *
 * @param {Object} user - The authenticated user object.
 * @param {ISettings | null} settings - The current user settings.
 */
export default function PushButton(
  { user, settings: defaultSettings }: { user: IAuthenticatedUser; settings: ISettings | null },
) {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ISettings>(defaultSettings ?? {});
  // New form values. Used to know when the email is set, unset for the current render.
  const [newValues, setNewValue] = useState<{ email?: string }>({ email: defaultSettings?.notifications?.email });
  const [pushState, setPushState] = useState<{ message: string; color: string }>();

  useEffect(() => {
    if (!globalThis?.OneSignalDeferred) globalThis.OneSignalDeferred = [];

    globalThis.OneSignalDeferred.push(function (OneSignal) {
      setIsPushSupported(OneSignal.Notifications.isPushSupported());
    });
  }, []);

  const handleToggleNotification = (type: "push" | "email") => {
    if (!settings.notifications || !globalThis?.OneSignal || !globalThis?.OneSignalDeferred) return;

    if (
      type === "email" && newValues.email &&
      !newValues.email.match(/^[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9.\-]+$/)
    ) {
      setPushState({
        message: "Please enter a valid email address.",
        color: "error",
      });
      return;
    }

    globalThis.OneSignalDeferred.push(async function (OneSignal) {
      setIsLoading(true);

      const currentId = OneSignal.User.externalId;
      const userId = user.email ?? user.name;

      if (currentId && currentId !== userId) {
        await OneSignal.logout();
      }

      if (!OneSignal.User.externalId) {
        await OneSignal.login(userId);
        OneSignal.User.addTag("username", user.name);
      }

      const currentEmail = settings?.notifications?.email;
      const newEmail = newValues.email;

      if (type === "email" && currentEmail !== newEmail) {
        // If has current email, remove it and add the new one (replace instead of add).
        if (currentEmail) OneSignal.User.removeEmail(currentEmail);

        if (newEmail) OneSignal.User.addEmail(newEmail);

        ky.put("/api/settings/opt", { json: { onesignal_id: userId, email: newEmail } })
          .json<ISettings | null>()
          .then((res) => {
            if (!res) throw new Error("Failed to update settings");
            setSettings(res);
            setPushState({ message: "Settings updated successfully.", color: "success" });
          })
          .catch((error) => {
            console.error("Error updating settings:", error);
            setPushState({ message: "Failed to update settings.", color: "error" });
          })
          .finally(() => setIsLoading(false));
      } else if (type === "push") {
        // Handle push notifications
        if (OneSignal.User.PushSubscription.optedIn) await OneSignal.User.PushSubscription.optOut();
        else await OneSignal.User.PushSubscription.optIn();

        setIsLoading(false);
      }
    });
  };

  return globalThis?.OneSignalDeferred
    ? (
      <>
        <div class="flex items-start w-full">
          {isPushSupported &&
            (
              <>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend pt-0">Web push</legend>
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={defaultSettings?.notifications?.push}
                      className="toggle toggle-success"
                      onClick={() => handleToggleNotification("push")}
                      disabled={isLoading}
                    />
                  </div>
                </fieldset>
                <div className="divider divider-horizontal" />
              </>
            )}
          {user?.email && (
            <fieldset class="fieldset grow">
              <legend class="fieldset-legend pt-0">Mail push</legend>
              <div class="flex items-center gap-2">
                <input
                  type="email"
                  name="email"
                  class="input w-full"
                  placeholder="Email address"
                  value={newValues.email ?? ""}
                  onChange={(e) => {
                    const email = (e.target as HTMLInputElement).value.trim();
                    setNewValue((p) => ({ ...p, email }));
                  }}
                  disabled={isLoading}
                />
                {(newValues.email !== settings.notifications?.email) &&
                  (
                    <button
                      class="btn btn-primary"
                      type="button"
                      onClick={() => handleToggleNotification("email")}
                    >
                      {/* @ts-ignore */}
                      <Check size={16} />
                    </button>
                  )}
              </div>
            </fieldset>
          )}
        </div>
        {pushState && (
          <p class={`fieldset-label mt-2 text-${pushState.color}`}>
            {pushState.message}
          </p>
        )}
      </>
    )
    : null;
}
