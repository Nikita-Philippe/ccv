import RecoveryKeySaver from "@islands/Auth/RecoveryKeySaver.tsx";
import Card from "../../components/UI/Card.tsx";
import { RouteConfig } from "$fresh/server.ts";
import Button from "@islands/UI/Button.tsx";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default function FirstConnexion(req: Request) {
  const recoveryKey = new URL(req.url).searchParams.get("recovery");

  return (
    <div class="max-w-2xl p-6 mx-auto relative h-screen flex flex-col justify-center gap-4">
      <h1 class="text-2xl font-bold">Welcome to CCV!</h1>
      <p class="my-2">
        By signing in, you've enabled syncing across devices, and your data will be securely stored in our database.
      </p>

      <h2 class="text-xl font-semibold text-error underline">Save Your Recovery Key</h2>
      <p class="text-error-content">
        This recovery key is the <strong>only way</strong>{" "}
        to access your data if you lose access to your account. Without it, your data will be{" "}
        <strong>permanently</strong> lost.
      </p>

      {recoveryKey && (
        <Card>
          <RecoveryKeySaver recoveryKey={recoveryKey} />

          <div role="alert" className="alert alert-error alert-soft w-full">
            <ul class="list-disc pl-5 space-y-1 *:text-error-content">
              <li>This key will only be shown once</li>
              <li>Without this key, I cannot recover my data if I lose access to my account</li>
              <li>This key should be stored in a secure location</li>
            </ul>
          </div>
        </Card>
      )}
      <h2 class="text-xl font-semibold">What's Next?</h2>
      <p class="mb-4">
        Create your first{" "}
        <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
          <a href="/app/config">configuration</a>
        </Button>{" "}
        and start tracking your habits.
      </p>
    </div>
  );
}
