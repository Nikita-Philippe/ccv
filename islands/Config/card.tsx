import { useEffect, useState } from "preact/hooks";
import { type ChangeEvent } from "preact/compat";
import { EConfigCardType, IIntField, IMultistringField, IntFieldVariants, IPartialContent } from "@models/Content.ts";
import { debounce } from "lodash";

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
};

export default function ConfigCard({ bubbleConfig, removeConfig, config: initialConfig }: Props) {
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
    <div className="border rounded p-4 max-w-md mx-auto">
      <div className="grid gap-6 mb-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={`block mb-2 ${configErrors.name ? "text-red-500" : ""}`}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`w-full p-2 border ${configErrors.name ? "border-red-500" : "border-gray-300"} rounded`}
            value={config.name}
            onChange={handleChange}
          />
          {configErrors.name && <p className="mt-2 text-red-500 text-sm">{configErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="label" className={`block mb-2 ${configErrors.label ? "text-red-500" : ""}`}>
            Label
          </label>
          <input
            id="label"
            name="label"
            type="text"
            className={`w-full p-2 border ${configErrors.label ? "border-red-500" : "border-gray-300"} rounded`}
            value={config.label}
            onChange={handleChange}
          />
          {configErrors.label && <p className="mt-2 text-red-500 text-sm">{configErrors.label}</p>}
        </div>

        <div>
          <label htmlFor="label" className={`block mb-2 ${configErrors.label ? "text-red-500" : ""}`}>
            Group
          </label>
          <input
            id="group"
            name="group"
            type="text"
            className={`w-full p-2 border ${configErrors.label ? "border-red-500" : "border-gray-300"} rounded`}
            value={config.group}
            onChange={handleChange}
          />
          {configErrors.label && <p className="mt-2 text-red-500 text-sm">{configErrors.group}</p>}
        </div>

        <div>
          <label className="block mb-2">Select a field type</label>
          <select
            name="type"
            className="w-full p-2 border border-gray-300 rounded"
            value={config.type}
            onChange={handleChange}
          >
            {fieldTypes.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="icon" className="block mb-2">
            Icon
          </label>
          <input
            type="text"
            id="icon"
            className="w-full p-2 border border-gray-200 bg-gray-100 rounded"
            disabled
          />
        </div>

        {config.type === "multistring" && (
          <div>
            <label htmlFor="input_nb" className="block mb-2">
              Number of inputs
            </label>
            <input
              id="input_nb"
              name="input_nb"
              type="number"
              className="w-full p-2 border border-gray-300 rounded"
              value={(config as IMultistringField).input_nb}
              onChange={handleNumberChange}
              pattern="[0-9]*"
            />
          </div>
        )}

        {config.type === "int" && (
          <div>
            <label htmlFor="max" className={`block mb-2 ${configErrors.max ? "text-red-500" : ""}`}>
              Variant
            </label>
            <select
              id="variant"
              name="variant"
              className="w-full p-2 border border-gray-300 rounded"
              value={(config as IIntField).variant}
              onChange={handleChange}
            >
              {config.type === "int" && IntFieldVariants.map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </select>
            {configErrors.max && <p className="mt-2 text-red-500 text-sm">{configErrors.max}</p>}
          </div>
        )}

        {config.type === "int" && (
          <>
            <div>
              <label htmlFor="min" className={`block mb-2 ${configErrors.min ? "text-red-500" : ""}`}>
                Min
              </label>
              <input
                id="min"
                name="min"
                type="number"
                className={`w-full p-2 border ${configErrors.min ? "border-red-500" : "border-gray-300"} rounded`}
                value={(config as IIntField).min}
                onChange={handleNumberChange}
                pattern="[0-9]*"
              />
              {configErrors.min && <p className="mt-2 text-red-500 text-sm">{configErrors.min}</p>}
            </div>
            <div>
              <label htmlFor="max" className={`block mb-2 ${configErrors.max ? "text-red-500" : ""}`}>
                Max
              </label>
              <input
                id="max"
                name="max"
                type="number"
                className={`w-full p-2 border ${configErrors.max ? "border-red-500" : "border-gray-300"} rounded`}
                value={(config as IIntField).max}
                onChange={handleNumberChange}
                pattern="[0-9]*"
              />
              {configErrors.max && <p className="mt-2 text-red-500 text-sm">{configErrors.max}</p>}
            </div>
          </>
        )}
      </div>

      <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={remove}>
        <span className="inline-block">&#128465;</span> {/* Trash icon placeholder */}
      </button>
    </div>
  );
}
