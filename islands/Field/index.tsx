import { EConfigCardType, TField } from "@models/Content.ts";
import { useState } from "preact/hooks";
import { FIELD_MULTISTRING_DELIMITER } from "@utils/constants.ts";

type FieldProps = {
  field: TField;
  lastValue?: any; // TODO: type this
};

export default function Field({ field, lastValue }: FieldProps) {
  const [value, setValue] = useState<string>(lastValue);

  const baseInputProps = {
    class:
      "block w-full px-3 py-2 mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
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
        return <input type="text" {...baseInputProps} />;
      case EConfigCardType.boolean:
        return (
          <>
            {/* Set hidden to, if unchecked, send the value */}
            <input type="hidden" name={field.name} value={0} />
            <input type="checkbox" {...baseInputProps} />
          </>
        );
      case EConfigCardType.int:
        return <input type="number" {...baseInputProps} />;
      case EConfigCardType.textarea:
        return <textarea {...baseInputProps} />;
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
                {...baseInputProps}
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
    <div>
      <label htmlFor={field.name} className="block mb-2">{field.label}</label>
      {content()}
    </div>
  );
}
