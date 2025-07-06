import { defineConfig } from "$fresh/server.ts";
import kv_oauth from "./plugins/kv_oauth.ts";

export default defineConfig({
  plugins: [kv_oauth],
  server: {
    port: parseInt(Deno.env.get("PORT") || "8080"),
  }
});
