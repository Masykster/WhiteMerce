// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const isBunRuntime = Boolean(process.versions?.bun);
const requestedAdapter = process.env.ASTRO_ADAPTER;
const useStandaloneBunAdapter =
  requestedAdapter === "bun" ||
  requestedAdapter === "node" ||
  (requestedAdapter !== "cloudflare" && isBunRuntime);

export default defineConfig({
  site: "http://localhost:4321",
  output: "server",
  adapter: useStandaloneBunAdapter
    ? node({ mode: "standalone" })
    : cloudflare({
        imageService: "passthrough",
      }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
