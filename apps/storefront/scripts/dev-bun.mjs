import { dev } from "astro";

const port = process.env.PORT ? Number(process.env.PORT) : 4321;
const server = await dev({
  server: { port },
});

const shutdown = async () => {
  await server.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
