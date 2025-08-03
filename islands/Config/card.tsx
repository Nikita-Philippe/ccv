import { useEffect, useMemo, useState } from "preact/hooks";
import { type ChangeEvent } from "preact/compat";
import { EConfigCardType, IIntField, IMultistringField, IntFieldVariants, IPartialContent } from "@models/Content.ts";
import { debounce } from "lodash";
import { IconCopy as Copy, IconTrash as Trash } from "@icons";
import { cn } from "@utils/cn.ts";
import Card from "../../components/UI/Card.tsx";

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
    const { min, max, step, variant } = cfg as IIntField;
    if (min !== undefined && min < 0) errors.min = "Min must be greater than 0";
    if (min !== undefined && max !== undefined && min > max) {
      errors.max = "Max must be greater than Min";
    }
    if (step !== undefined && step < 0) errors.step = "Step must be greater than 0";
    if (variant === "rating" || variant === "range") {
      if (min == undefined) errors.min = "Min is required for rating";
      if (max == undefined) errors.max = "Max is required for rating";
      if (step == undefined) errors.step = "Step is required for rating";
    }
  }

  if (cfg.type === EConfigCardType.multistring) {
    if ((cfg as IMultistringField).input_nb < 1) errors.input_nb = "Input number must be greater than 0";
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
  const configErrors = useMemo(() => validateConfig(config), [JSON.stringify(config)]);

  const isAlreadyConfigured = useMemo(() => Boolean(initialConfig?.name), []);

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
        <fieldset
          className={cn("fieldset", isAlreadyConfigured && "tooltip")}
          data-tip="Le nom est unique et ne peux être changé."
        >
          <legend htmlFor="name" className="fieldset-legend">Name</legend>
          <input
            type="text"
            name="name"
            className={cn("input input-bordered w-full", configErrors.name && "input-error")}
            value={config.name}
            onChange={handleChange}
            readOnly={isAlreadyConfigured}
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


        {/* Multistring Field */}
        {config.type === "multistring" && (
          <fieldset className="fieldset">
            <legend htmlFor="input_nb" className="fieldset-legend">Number of Inputs</legend>
            <input
              id="input_nb"
              name="input_nb"
              type="number"
              className={cn("input input-bordered w-full", configErrors.input_nb && "input-error")}
              value={(config as IMultistringField).input_nb}
              onChange={handleNumberChange}
              pattern="[0-9]*"
            />
            {configErrors.input_nb && <p className="fieldset-label text-error">{configErrors.input_nb}</p>}
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
          <div className="col-span-2 grid gap-x-2 md:grid-cols-3">
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

            {/* Int Field: Max */}
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

            {/* Int Field: Step */}
            <fieldset className="fieldset">
              <legend htmlFor="step" className="fieldset-legend">Step</legend>
              <input
                id="step"
                name="step"
                type="number"
                className={cn("input input-bordered w-full", configErrors.step && "input-error")}
                value={(config as IIntField).step}
                onChange={handleNumberChange}
                pattern="[0-9]*"
              />
              {configErrors.step && <p className="fieldset-label text-error">{configErrors.step}</p>}
            </fieldset>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-2 justify-end">
        <button type="button" className="btn" onClick={duplicateConfig}>
          <Copy size={20} />
        </button>
        <button type="button" className="btn btn-error" onClick={remove}>
          <Trash size={20} />
        </button>
      </div>
    </Card>
  );
}
