/**
 * Rotates the `app_user` Postgres role's password (see prisma/migrations/*_app_role)
 * and writes the resulting connection string to DATABASE_URL_APP in .env.local.
 * Run with: npm run db:rotate-app-role-password
 *
 * Connects as the privileged neondb_owner role (via DATABASE_URL_UNPOOLED), not
 * through lib/db/client.ts — altering another role's password is an admin
 * operation app_user itself isn't granted.
 */
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "../lib/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL_UNPOOLED! });
  const admin = new PrismaClient({ adapter });

  const password = randomBytes(24).toString("base64url");
  await admin.$executeRawUnsafe(`ALTER ROLE app_user WITH PASSWORD '${password}'`);
  await admin.$disconnect();

  const appUrl = new URL(process.env.DATABASE_URL!);
  appUrl.username = "app_user";
  appUrl.password = password;

  const envPath = ".env.local";
  const current = readFileSync(envPath, "utf8");
  const line = `DATABASE_URL_APP="${appUrl.toString()}"`;
  const updated = current.includes("DATABASE_URL_APP=")
    ? current.replace(/^DATABASE_URL_APP=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, updated);
  console.log("Rotated app_user password and wrote DATABASE_URL_APP to .env.local");
}

main();
