import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/client";
import { AUTH_ERRORS } from "./errors";

/**
 * Resolves the authenticated user for server-side reads/mutations, creating
 * the internal `users` row on first sight. The `users` table has no RLS
 * (see prisma/migrations/*_enable_rls) since this lookup has to run before
 * any per-user session context exists.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error(AUTH_ERRORS.unauthenticated);
  }
  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId },
  });
}
