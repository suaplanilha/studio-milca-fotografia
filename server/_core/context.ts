import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"] & { user?: User };
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // User is already set by authMiddleware
  const user = (opts.req as any).user || null;

  return {
    req: opts.req as any,
    res: opts.res,
    user,
  };
}
