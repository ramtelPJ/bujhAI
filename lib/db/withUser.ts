import { prisma } from "./client";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Runs `fn` inside a transaction with `app.current_user_id` set for the
 * duration of that transaction — the RLS policies (prisma/migrations/*_enable_rls)
 * read this via `current_setting('app.current_user_id', true)`. Every server
 * read/mutation must go through this instead of the bare `prisma` client.
 */
export function withUser<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn(tx);
  });
}
