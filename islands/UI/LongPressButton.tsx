import { JSX } from "preact/jsx-runtime";
import { cn } from "@utils/cn.ts";
import { useRef } from "preact/hooks";
import { DateTime } from "luxon";

type LongPressButtonProps = {
  pressDuration?: number;
  onLongPress?: () => void;
  formId?: string;
  children?: JSX.Element | JSX.Element[];
} & JSX.IntrinsicElements["button"];

export default function LongPressButton({
  pressDuration = 500,
  onLongPress,
  formId,
  children,
  ...props
}: LongPressButtonProps) {
  const { class: defaultClass, className, ...rest } = props; // Destructure class and className to avoid conflicts

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const currentTimer = useRef<number>();

  const handleStartPressing = (e: PointerEvent | MouseEvent | FocusEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentTimer.current) {
      currentTimer.current = DateTime.now().toMillis();
      if (btnRef.current) {
        btnRef.current.style.setProperty("--anim-maxWidth", "100%");
        btnRef.current.style.setProperty("--anim-time", `${pressDuration}ms`);
      }
    }
  };

  const handleCancelPressing = (e: PointerEvent | MouseEvent | FocusEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentTimer.current) {
      const nowTime = DateTime.now().toMillis();
      if (currentTimer.current + pressDuration <= nowTime) {
        handleLongPressComplete();
      }
      currentTimer.current = undefined;
      if (btnRef.current) {
        btnRef.current.style.setProperty("--anim-maxWidth", "0%");
        btnRef.current.style.setProperty("--anim-time", "500ms");
      }
    }
  };

  const handleLongPressComplete = () => {
    if (onLongPress) onLongPress();

    // If a form ID is provided, submit that form
    if (formId) {
      const form = document.getElementById(formId) as HTMLFormElement;
      if (form) form.submit();
    }
  };

  const cancelEvents = (e: PointerEvent | MouseEvent | FocusEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <button
      {...rest}
      ref={btnRef}
      form={formId} // Connect to the form by ID
      onClick={cancelEvents}
      onPointerDown={handleStartPressing}
      onPointerUp={handleCancelPressing}
      onPointerCancel={handleCancelPressing}
      onBlur={handleCancelPressing}
      className={cn("btn relative overflow-hidden", className, defaultClass)}
    >
      <span
        className={cn("absolute bottom-0 left-0 h-full bg-[#00000013] w-0")}
        style={{
          width: "var(--anim-maxWidth, 0)",
          transition: `width var(--anim-time, ${pressDuration}ms) linear`,
        }}
      />
      {children}
    </button>
  );
}
