import { cn } from "@utils/cn.ts";
import { omit } from "lodash";
import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";

type Props = Omit<JSX.HTMLAttributes<HTMLButtonElement>, "loading"> & {
  loading?: boolean;
  containerProps?: JSX.HTMLAttributes<HTMLDivElement>;
  spinnerProps?: JSX.HTMLAttributes<HTMLSpanElement>;
};

/** Simple button component with loading state.
 *
 * @param loading - Whether the button is in a loading state.
 * @example
 * ```tsx
 * // In an SSR context, use the loading props to control the default loading state.
 * <Button loading={true} onClick={() => console.log("Clicked!")}>
 *
 * // In a client-side context, you can either control the loading state with a state variable or pass it directly.
 * const [loadingState, setLoadingState] = useState(false);
 * <Button loading={loadingState} onClick={() => setLoadingState(true)}>
 * ```
 */
export default function Button({ loading, containerProps, spinnerProps, ...props }: Props) {
  const [loadingState, setLoadingState] = useState<boolean>(loading ?? false);

  useEffect(() => {
    if (loading !== undefined) {
      setLoadingState(loading);
    }
  }, [loading]);

  const handleClick = (e: JSX.TargetedMouseEvent<HTMLButtonElement> | JSX.TargetedTouchEvent<HTMLButtonElement>) => {
    if (loadingState) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Use requestAnimationFrame to avoid blocking the main thread (usually when submit form is called)
    requestAnimationFrame(() => setLoadingState(true));
    props.onClick?.(e as JSX.TargetedMouseEvent<HTMLButtonElement>);
    props.onMouseUp?.(e as JSX.TargetedMouseEvent<HTMLButtonElement>);
    props.onTouchEnd?.(e as JSX.TargetedTouchEvent<HTMLButtonElement>);
  };

  return (
    <button
      {...omit(props, ["loading", "containerProps", "spinnerProps"])}
      type={props.type ?? "button"}
      onClick={handleClick}
      onMouseUp={handleClick}
      onTouchEnd={handleClick}
      aria-busy={loadingState}
      aria-disabled={loadingState}
      disabled={loadingState}
      className={cn("", props.class, props.className)}
    >
      <div
        class={cn("flex items-center justify-center gap-2", containerProps?.class, containerProps?.className)}
        {...omit(containerProps, ["class", "className"])}
      >
        {loadingState && (
          <span
            class={cn("loading loading-sm", spinnerProps?.class ?? "loading-spinner", spinnerProps?.className)}
            {...omit(spinnerProps, ["class", "className"])}
          />
        )}
        {props.children}
      </div>
    </button>
  );
}
