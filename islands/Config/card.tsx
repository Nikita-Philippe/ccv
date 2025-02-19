import { useEffect, useState } from "preact/hooks";
import { type ChangeEvent } from "preact/compat";
import { EConfigCardType, IIntField, IMultistringField, IntFieldVariants, IPartialContent } from "@models/Content.ts";
import { debounce } from "lodash";
import Trash from "@icons/trash.tsx";
import Copy from "@icons/copy.tsx";
import { cn } from "@utils/cn.ts";
import Card from "@islands/UI/Card.tsx";

type Config = IPartialContent["fields"][0];

const fieldTypes = [
  { value: "boolean", name: "Boolean" },
  { value: "int", name: "Number" },
  { value: "string", name: "Text" },
  { value: "textarea", name: "Textarea" },
  { value: "multistring", name: "Multiline Text" },
];

function validateConfig(cfg: Config) {
  const errors: Record<string, string> = {};
  if (!cfg.name) errors.name = "Name is required";
  else if (!/^[a-zA-Z0-9_]+$/.test(cfg.name)) errors.name = "Name must be alphanumeric";
  if (cfg.type === EConfigCardType.int) {
    const { min, max } = cfg as IIntField;
    if (min !== undefined && min < 0) errors.min = "Min must be greater than 0";
    if (min !== undefined && max !== undefined && min > max) {
      errors.max = "Max must be greater than Min";
    }
  }
  return errors;
}

type Props = {
  config: Config;
  bubbleConfig: (config: Config) => void;
  removeConfig: () => void;
  duplicateConfig: () => void;
};

export default function ConfigCard({ bubbleConfig, removeConfig, duplicateConfig, config: initialConfig }: Props) {
  const [config, setConfig] = useState<Config>(initialConfig);
  const configErrors = validateConfig(config);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    if (!target.name || !target.value) return;
    setConfig({ ...config, [target.name]: target.value });
  }

  function handleNumberChange(e: ChangeEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    if (!target.name || !target.value) return;
    setConfig({ ...config, [target.name]: parseInt(target.value, 10) || 0 });
  }

  const remove = () => {
    if (!config.name || (config.name && confirm("Are you sure you want to remove this field?"))) removeConfig();
  };

  useEffect(() => {
    if (Object.keys(configErrors).length === 0) {
      const debounced = debounce(() => bubbleConfig(config), 500);
      debounced();
      return () => debounced.cancel();
    }
  }, [config]);

  return (
    <Card sx={{ content: "flex-col justify-between" }}>
      <div className="grid gap-x-2 mb-2 md:grid-cols-2">
        {/* Name Field */}
        <fieldset className="fieldset">
          <legend htmlFor="name" className="fieldset-legend">Name</legend>
          <input
            type="text"
            name="name"
            className={cn("input input-bordered w-full", configErrors.name && "input-error")}
            value={config.name}
            onChange={handleChange}
          />
          {configErrors.name && <p className="fieldset-label text-error">{configErrors.name}</p>}
        </fieldset>

        {/* Label Field */}
        <fieldset className="fieldset">
          <legend htmlFor="label" className="fieldset-legend">Label</legend>
          <input
            id="label"
            name="label"
            type="text"
            className={cn("input input-bordered w-full", configErrors.label && "input-error")}
            value={config.label}
            onChange={handleChange}
          />
          {configErrors.label && <p className="fieldset-label text-error">{configErrors.label}</p>}
        </fieldset>

        {/* Group Field */}
        <fieldset className="fieldset">
          <legend htmlFor="group" className="fieldset-legend">Group</legend>
          <input
            id="group"
            name="group"
            type="text"
            className={cn("input input-bordered w-full", configErrors.group && "input-error")}
            value={config.group}
            onChange={handleChange}
          />
          {configErrors.group && <p className="fieldset-label text-error">{configErrors.group}</p>}
        </fieldset>

        {/* Field Type Select */}
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Field Type</legend>
          <select
            name="type"
            className="select select-bordered w-full"
            value={config.type}
            onChange={handleChange}
          >
            {fieldTypes.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.name}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Icon Field */}
        <fieldset className="fieldset">
          <legend htmlFor="icon" className="fieldset-legend">Icon</legend>
          <input
            type="text"
            id="icon"
            className="input input-bordered bg-gray-100 w-full"
            disabled
          />
        </fieldset>

        {/* Multistring Field */}
        {config.type === "multistring" && (
          <fieldset className="fieldset">
            <legend htmlFor="input_nb" className="fieldset-legend">Number of Inputs</legend>
            <input
              id="input_nb"
              name="input_nb"
              type="number"
              className="input input-bordered w-full"
              value={(config as IMultistringField).input_nb}
              onChange={handleNumberChange}
              pattern="[0-9]*"
            />
          </fieldset>
        )}

        {/* Int Field: Variant */}
        {config.type === "int" && (
          <fieldset className="fieldset">
            <legend htmlFor="variant" className="fieldset-legend">Variant</legend>
            <select
              id="variant"
              name="variant"
              className="select select-bordered w-full"
              value={(config as IIntField).variant}
              onChange={handleChange}
            >
              {IntFieldVariants.map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </select>
            {configErrors.max && <p className="fieldset-label text-error">{configErrors.max}</p>}
          </fieldset>
        )}

        {/* Int Field: Min */}
        {config.type === "int" && (
          <fieldset className="fieldset">
            <legend htmlFor="min" className="fieldset-legend">Min</legend>
            <input
              id="min"
              name="min"
              type="number"
              className={cn("input input-bordered w-full", configErrors.min && "input-error")}
              value={(config as IIntField).min}
              onChange={handleNumberChange}
              pattern="[0-9]*"
            />
            {configErrors.min && <p className="fieldset-label text-error">{configErrors.min}</p>}
          </fieldset>
        )}

        {/* Int Field: Max */}
        {config.type === "int" && (
          <fieldset className="fieldset">
            <legend htmlFor="max" className="fieldset-legend">Max</legend>
            <input
              id="max"
              name="max"
              type="number"
              className={cn("input input-bordered w-full", configErrors.max && "input-error")}
              value={(config as IIntField).max}
              onChange={handleNumberChange}
              pattern="[0-9]*"
            />
            {configErrors.max && <p className="fieldset-label text-error">{configErrors.max}</p>}
          </fieldset>
        )}
      </div>

      <div className="flex gap-2 mt-2 justify-end">
        <button className="btn" onClick={duplicateConfig}>
          <Copy size={20} />
        </button>
        <button className="btn btn-error" onClick={remove}>
          <Trash size={20} />
        </button>
      </div>
    </Card>
  );
}
