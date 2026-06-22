/**
 * Next.js server runtime entry. Runs once when the server boots.
 * Used to register the ErrorLog writer so withErrorHandler can persist 5xx
 * errors without statically coupling @/modules/shared to lib/prisma.
 *
 * Ponytail: instrumentation runs in both edge and node runtimes; the writer
 * import is server-only and safe here.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureErrorLogWriterRegistered } = await import(
      "@/lib/register-error-log-writer"
    );
    ensureErrorLogWriterRegistered();
  }
}
