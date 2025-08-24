import { cn } from "@utils/cn.ts";
import { JSX } from "preact";
import { ReactNode } from "preact/compat";
import { useState } from "preact/hooks";

type useModalProps = {
  defaultOpen?: boolean;
  dialog?: {
    props?: Omit<JSX.HTMLAttributes<HTMLDialogElement>, "id">;
    boxProps?: JSX.HTMLAttributes<HTMLDivElement>;
    deps?: ReadonlyArray<unknown>;
  };
  closeButton?: {
    formProps?: Omit<JSX.HTMLAttributes<HTMLFormElement>, "method">;
    buttonProps?: Omit<JSX.HTMLAttributes<HTMLButtonElement>, "type">;
    deps?: ReadonlyArray<unknown>;
  };
} | undefined;

/** Modal hook based on DaisyUI modals.
 *
 * @param defaultOpen Whether the modal is open by default.
 * @param dialog Props for the dialog element and its box.
 * @param closeButton Props for the close button and its form.
 * @returns { Dialog, CloseButton, isOpen, setIsOpen } Components and state to control the modal.
 * @example
 * const { Dialog, isOpen, setIsOpen } = useModal();
 * return (
 *   <>
 *     <button onClick={() => setIsOpen(true)}>Open Modal</button>
 *     <Dialog>
 *       <h3>Modal Title</h3>
 *       <p>Modal Content</p>
 *     </Dialog>
 *   </>
 * )
 */
export default function useModal({ defaultOpen, dialog, closeButton }: useModalProps = {}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  const Dialog = ({ children }: { children?: ReactNode }) => (
    <dialog
      {...dialog?.props}
      className={cn(
        "modal modal-bottom sm:modal-middle",
        dialog?.props?.class,
        dialog?.props?.className,
      )}
      open={isOpen}
    >
      <div
        {...dialog?.boxProps}
        className={cn(
          "modal-box",
          dialog?.boxProps?.class,
          dialog?.boxProps?.className,
        )}
      >
        <CloseButton />
        {children}
      </div>
    </dialog>
  );

  const CloseButton = ({ children }: { children?: ReactNode }) => (
    <form
      {...closeButton?.formProps}
      method="dialog"
      className={cn("modal-backdrop", closeButton?.formProps?.class, closeButton?.formProps?.className)}
    >
      <button
        {...closeButton?.buttonProps}
        type="submit"
        className={cn(
          "btn btn-sm btn-circle btn-ghost absolute right-2 top-2",
          closeButton?.buttonProps?.class,
          closeButton?.buttonProps?.className,
        )}
        onClick={() => setIsOpen(false)}
      >
        {children ?? closeButton?.buttonProps?.children ?? "✕"}
      </button>
    </form>
  );

  return {
    Dialog,
    CloseButton,
    isOpen,
    setIsOpen,
  };
}
