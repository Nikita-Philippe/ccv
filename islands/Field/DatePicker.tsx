import { useEffect, useRef, useState } from "preact/hooks";
import { DateTime } from "luxon";

export const DateToLocale = (date: string) => DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);

type DatePickerProps = {
  /** Default date as an ISO string (YYYY-MM-DD) */
  defaultValue: string;
  /** Callback fired when the date changes */
  onChange?: (newDate: string) => void;
  /** Additional classes for the input */
  className?: string;
  /** Manually set the date */
  customDate?: string;
  min?: string;
  max?: string;
};

export default function DatePicker({
  defaultValue,
  onChange,
  className,
  customDate,
  min,
  max,
}: DatePickerProps) {
  const [date, setDate] = useState(defaultValue);
  useEffect(() => setDate(customDate || defaultValue), [customDate]);
  const inputRef = useRef<HTMLInputElement>(null);

  // When date changes through the picker, update state and notify parent.
  const handleDateChange = (selectedDate: Date) => {
    const iso = selectedDate.toISOString().split("T")[0];
    if (!iso) return;
    setDate(iso);
    if (onChange) onChange(iso);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !inputRef.current) return;
    // Dynamically import Pikaday only on the client
    import("pikaday")
      .then(({ default: Pikaday }) => {
        const picker = new Pikaday({
          field: inputRef.current,
          onSelect: handleDateChange,
          ...(min ? { minDate: new Date(min) } : {}),
          ...(max ? { maxDate: new Date(max) } : {}),
        });
        return () => picker.destroy();
      })
      .catch((err) => console.trace("Failed to load Pikaday:", err));
  }, []);

  return (
    <input
      type="text"
      ref={inputRef}
      className={className || "input pika-single p-0"}
      value={DateToLocale(date)}
      readOnly
    />
  );
}
