export const DebugFlag = {
  http: "http",
  env: "env",
  cron: "cron",
  crypto: "crypto",
  kv: "kv",
  user: "user",
  reminders: "reminders",
  perf_http: "perf_http",
  perf_kv: "perf_kv",
  perf_crypto: "perf_crypto",
  perf_user: "perf_user",
  perf_cron: "perf_cron",
  perf_reminders: "perf_reminders",
  entries: "entries",
} as const;

const isClientSide = () => globalThis?.document !== undefined;

/** Simple debug class to check if debug mode is enabled and if a specific flag is enabled.
 *
 * @example
 * ```ts
 * const flags = Debug.get();
 * const isHttpDebug = Debug.get("http");
 */
export class Debug {
  static #instance: Debug | null = null;
  private active: boolean = false;
  private flags: Array<keyof typeof DebugFlag> = [];

  private constructor() {
    if (isClientSide()) throw new Error("Debug class should not be used in client side.");

    const env = globalThis.ccv_config.server?.debug

    if (!env) return; // No debug mode

    this.flags = Array.from(new Set(env));

    console.log(`Debug mode enabled with flags: ${this.flags.join(", ")}`);

    if (this.flags.length) this.active = true;
  }

  public static get(): (keyof typeof DebugFlag)[] | null;
  public static get(flag: keyof typeof DebugFlag): boolean | null;
  public static get(flag?: keyof typeof DebugFlag) {

    if (isClientSide()) throw new Error("Debug class should not be used in client side.");

    // Create instance if it doesn't exist
    if (!Debug.#instance) {
      Debug.#instance = new Debug();
    }

    // Return null if not active
    if (!Debug.#instance.active) return null;


    // Return specific flag or all flags
    if (flag) return Debug.#instance.flags.includes(flag);
    return Debug.#instance.flags;
  }

  // TODO: maybe add some logging methods to log messages with the debug flag?
}
