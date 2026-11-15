import { build } from "astro";

// Exit explicitly after Astro finishes so Vite/Rolldown worker handles on Windows do not keep the Bun process alive.
await build({});
process.exit(0);
