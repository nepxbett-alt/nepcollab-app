// @lovable.dev/vite-tanstack-config includes tanstackStart, viteReact, tailwind, nitro, etc.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Deploy target: Vercel serverless (overrides default cloudflare worker preset)
  nitro: {
    preset: "vercel",
  },
});
