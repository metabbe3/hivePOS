import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ponytail: slow-query threshold as env var so it can be tuned without redeploy.
// Default 200ms — PG queries under that are usually fine.
const SLOW_QUERY_MS = parseInt(process.env.SLOW_QUERY_MS ?? "200", 10);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const base = new PrismaClient({
    adapter,
    // ponytail: emit query events so we can time every operation. $on('query')
    // is the standard Prisma hook — doesn't change the client type (unlike
    // $extends) so existing Tx helpers keep working.
    log: [{ emit: "event", level: "query" }],
  });

  // Slow-query capture. The query event fires for every SQL statement
  // including those inside transactions. We log the parameterized SQL
  // template (safe — placeholders, no values) + duration. NOT params
  // (could contain user data).
  //
  // Ceiling: one fire-and-forget write per slow query. If many queries are
  // slow simultaneously, this multiplies load. Upgrade path: batched writes
  // or move timing to a pg extension.
  base.$on("query", (e) => {
    if (e.duration > SLOW_QUERY_MS) {
      void base.telemetryEvent
        .create({
          data: {
            kind: "query.slow",
            payload: {
              // ponytail: truncate SQL — some queries (INSERTs with large
              // JSON) can be several KB. 200 chars is enough to identify
              // the query shape.
              sql: e.query.slice(0, 200),
              durationMs: e.duration,
            } as unknown as object,
          },
        })
        .catch(() => {
          // ponytail: swallow — telemetry is fire-and-forget.
        });
    }
  });

  return base;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Re-export Prisma namespace for transaction types
export { Prisma } from "@/app/generated/prisma/client";

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
