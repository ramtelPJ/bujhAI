import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  dirs: ["./trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      randomize: true,
    },
  },
  build: {
    // Prisma 7 / "prisma-client" provider (see prisma/schema.prisma) — modern
    // mode marks the generated client external instead of bundling it.
    // `prisma generate` must be run before `trigger dev`/`deploy` (see the
    // trigger:dev / trigger:deploy npm scripts).
    extensions: [prismaExtension({ mode: "modern" })],
  },
});
