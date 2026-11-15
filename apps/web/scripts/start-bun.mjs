import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = fileURLToPath(new URL(".", import.meta.url));
const appDir = path.resolve(scriptsDir, "..");
const standaloneAppDir = path.join(appDir, ".next", "standalone", "apps", "web");
const standaloneEntry = path.join(standaloneAppDir, "server.js");

if (!existsSync(standaloneEntry)) {
  console.error(
    `Missing Next.js standalone build at ${standaloneEntry}. Run "bun run build:bun" first.`,
  );
  process.exit(1);
}

// Next.js standalone server expects .next/static and public alongside server.js.
const staticSrc = path.join(appDir, ".next", "static");
const staticDest = path.join(standaloneAppDir, ".next", "static");
if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDest, { recursive: true, force: true });
}

const publicSrc = path.join(appDir, "public");
const publicDest = path.join(standaloneAppDir, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true, force: true });
}

process.env.PORT ??= "3000";
await import(pathToFileURL(standaloneEntry).href);
