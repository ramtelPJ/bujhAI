import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/lib/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Connects as `app_user` (see prisma/migrations/*_app_role), not the Neon
  // default role — that role has BYPASSRLS, which silently defeats every
  // RLS policy regardless of FORCE ROW LEVEL SECURITY.
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL_APP! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
