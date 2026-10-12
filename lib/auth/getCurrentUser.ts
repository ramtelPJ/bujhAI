import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@/lib/generated/prisma/client";
import { AUTH_ERRORS } from "./errors";

/**
 * Resolves the authenticated user for server-side reads/mutations, creating
 * the internal `users` row on first sight. The `users` table has no RLS
 * (see prisma/migrations/*_enable_rls) since this lookup has to run before
 * any per-user session context exists.
 *
 * `cache` dedupes the layout and page calls, which Next.js renders in
 * parallel within one request. Upsert is not atomic over the Neon adapter, so
 * a concurrent request can still win the insert; on P2002 we read its row.
 */
export const getCurrentUser = cache(async () => {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error(AUTH_ERRORS.unauthenticated);
  }
  try {
    return await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: { clerkId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.user.findUniqueOrThrow({ where: { clerkId } });
    }
    throw error;
  }
});
