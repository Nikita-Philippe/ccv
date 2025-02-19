import { EConfigCardType, TField } from "@models/Content.ts";
import { useState } from "preact/hooks";
import { FIELD_MULTISTRING_DELIMITER } from "@utils/constants.ts";
import { capitalize } from "lodash";

type FieldProps = {
  field: TField;
  lastValue?: any;
};

export default function Field({ field, lastValue }: FieldProps) {
  const [value, setValue] = useState<string>(lastValue);

  const baseInputProps = {
    name: field.name,
    defaultValue: lastValue,
    defaultChecked: lastValue,
  };

  const onCustomChange = (e: Event, index: number) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;
    setValue((prev) => {
      const values = prev?.split(FIELD_MULTISTRING_DELIMITER) ?? [];
      values[index] = newValue;
      return values.join(FIELD_MULTISTRING_DELIMITER);
    });
  };

  const content = () => {
    switch (field.type) {
      case EConfigCardType.string:
        return <input type="text" class="input input-primary w-full" {...baseInputProps} />;
      case EConfigCardType.boolean:
        return (
          <>
            {/* Set an hidden input to send the value to form even if unchecked */}
            <input type="hidden" name={field.name} value={0} />
            <input type="checkbox" className="checkbox checkbox-neutral" {...baseInputProps} />
          </>
        );
      case EConfigCardType.int:
        if (field.variant === "rating") {
          return (
            <>
              <input type="hidden" name={field.name} value={value} />
              <div class={"rating"}>
                {Array.from({ length: field.max ?? 5 }).map((_, i) => (
                  <input
                    key={i}
                    type="radio"
                    className="mask mask-circle mr-1"
                    checked={String(i) === value}
                    onChange={() => setValue(i.toString())}
                  />
                ))}
              </div>
            </>
          );
        } else if (field.variant === "range") {
          const range = {
            min: field.min ?? 0,
            max: field.max ?? 10,
            step: 1,
            stepNb: (field.max ?? 10) - (field.min ?? 0),
          };
          return (
            <div class="w-full max-w-xs">
              <input
                type="range"
                class="range"
                min={range.min}
                max={range.max}
                step={range.step}
                {...baseInputProps}
              />
              <div class="flex justify-between px-2.5 mt-2 text-xs">
                {Array.from({ length: range.stepNb + 1 }).map((_, i) => <span key={i}>{range.min + i}</span>)}
              </div>
            </div>
          );
        } else {
          return (
            <input
              type="number"
              class="input input-primary max-w-28"
              min={field.min}
              max={field.max}
              step={1}
              {...baseInputProps}
            />
          );
        }
      case EConfigCardType.textarea:
        return <textarea class="textarea" {...baseInputProps} />;
      case EConfigCardType.multistring:
        return (
          <div>
            {/* Input keeping the calculated value */}
            <input type="hidden" name={field.name} value={value} />
            {Array.from({ length: field.input_nb }).map((_, i) => (
              <input
                key={i}
                type="text"
                onChange={(e) => onCustomChange(e, i)}
                className="input input-primary"
                defaultValue={lastValue?.split(FIELD_MULTISTRING_DELIMITER)?.[i]}
                name={undefined}
              />
            ))}
          </div>
        );
      default:
        return <div>Unknown field type</div>;
    }
  };

  return (
    <fieldset className="fieldset max-w-1/2 grow">
      <legend className="fieldset-legend">{capitalize(field.label)}</legend>
      {content()}
    </fieldset>
  );
}
