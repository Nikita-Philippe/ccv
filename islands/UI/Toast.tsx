import useToast from "@hooks/useToast.tsx";
import { INotyfNotificationOptions, INotyfOptions } from "notyf";
import { useEffect } from "preact/hooks";

type Props = {
  toast: {
    type: "info" | "error" | "success" | "warning";
    message: string;
  };
  opts?: Partial<INotyfOptions>;
};

/** Toast component to display notifications using Notyf in an SSR context.
 *
 * * > Note: For client-side usage, prefer using the `useToast` hook directly. *
 *
 * @param {toast} - The toast object containing type and message.
 * @param {opts} - Optional Notyf options to customize the notification.
 */
export default function Toast({ toast, opts }: Props) {
  const { notif } = useToast(opts);

  useEffect(() => {
    if (!notif) return;

    // Use requestAnimationFrame to ensure the Notyf instance is ready before displaying the toast
    requestAnimationFrame(() => {
      notif.open(toast as INotyfNotificationOptions);
    });
  }, [notif, toast]);

  return null;
}
