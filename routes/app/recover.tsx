import { Handlers, RouteContext } from "$fresh/server.ts";
import Button from "@islands/UI/Button.tsx";
import FileDownloader from "@islands/UI/FileDownloader.tsx";
import LongPressButton from "@islands/UI/LongPressButton.tsx";
import { IDefaultPageHandler } from "@models/App.ts";
import { IContent, IDailyEntry } from "@models/Content.ts";
import { ERROR_MESSAGE } from "@models/Errors.ts";
import { recoverUserAccount } from "@utils/crypto/recovery.ts";
import Card from "@components/UI/Card.tsx";
import { getSessionId } from "../../plugins/kv_oauth.ts";

type HandlerType = IDefaultPageHandler & {
  recovered?: {
    configs: {
      filename: string;
      data: IContent | null;
    };
    entries: {
      filename: string;
      data: IDailyEntry[];
    };
  };
};

export const handler: Handlers<HandlerType | null> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const { action, ...formData } = Object.fromEntries(form);

    if (action !== "recover") return await ctx.render();
    else {
      const recoveryKey = formData.recovery_key as string;
      const recoveryEmail = formData.recovery_email as string;

      if (!recoveryKey) {
        return await ctx.render({ message: { type: "error", message: ERROR_MESSAGE.RECOVER_MISSING_KEY } });
      }
      if (!recoveryEmail) {
        return await ctx.render({ message: { type: "error", message: ERROR_MESSAGE.RECOVER_MISSING_EMAIL } });
      }

      const sessionId = await getSessionId(req!);
      const res = await recoverUserAccount(recoveryKey, recoveryEmail, sessionId ?? "");
      if (!res) return await ctx.render({ message: { type: "error", message: ERROR_MESSAGE.RECOVER_NOT_FOUND } });
      return await ctx.render({
        message: { type: "success", message: "Your datas have been recovered. You can download the files below." },
        recovered: res,
      });
    }
  },
};

export default async function Recover(_: Request, { data }: RouteContext<HandlerType>) {
  return (
    <>
      {(data?.recovered)
        ? (
          <div role="alert" className="alert alert-soft w-full flex flex-col gap-2">
            <p className="text-lg font-semibold">Account recovered</p>
            <p>
              Your account has been recovered and deleted. You can download the files below.
            </p>
            <div className="alert alert-error alert-soft">
              <p>
                Please do not reload this page, as the recovery key is single-use and your account has been deleted.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {data?.recovered?.configs.data && (
                <FileDownloader
                  filename={data.recovered.configs.filename}
                  data={JSON.stringify(data.recovered.configs.data)}
                  label="Config file (JSON)"
                  filetype="application/json"
                  asButton
                />
              )}
              {data?.recovered?.entries.data && (
                <FileDownloader
                  filename={data.recovered.entries.filename}
                  data={JSON.stringify(data.recovered.entries.data)}
                  label="Daily entries (JSON)"
                  filetype="application/json"
                  asButton
                />
              )}
            </div>
            <a href="/app">
              <Button type="submit" className="btn w-fit mt-4 self-start" spinnerProps={{ class: "loading-dots" }}>
                Go back to the home page
              </Button>
            </a>
          </div>
        )
        : (
          <Card title="Recover" sx={{ content: "border-2 border-error border-dashed p-4 flex-col no-wrap relative" }}>
            <form
              method="POST"
              className="flex flex-col gap-2 justify-start"
              id="recover-form"
            >
              <input type="hidden" name="action" value="recover" />
              <fieldset className="fieldset p-0">
                <legend className="fieldset-legend">Recover key</legend>
                <input
                  type="text"
                  class="input input-primary w-full"
                  name="recovery_key"
                />
              </fieldset>
              <fieldset className="fieldset p-0">
                <legend className="fieldset-legend">Account email</legend>
                <input type="email" class="input input-primary w-full" name="recovery_email" />
              </fieldset>
              <div role="alert" className="alert alert-error alert-soft w-full">
                <p>
                  I understand that this operation is destructive. After recovery, my account and all associated datas
                  will be deleted.
                </p>
                <LongPressButton
                  className="btn-error w-fit whitespace-nowrap"
                  pressDuration={2000}
                  formId="recover-form"
                >
                  <p>Recover account</p>
                </LongPressButton>
              </div>
            </form>
          </Card>
        )}
    </>
  );
}
