/**
 * Date helpers used across modules.
 *
 * Centralized so the "end of day" convention (23:59:59.999 local) and the
 * common date-range parsing logic aren't re-implemented per call site.
 */

/**
 * Mutate `d` in place to the last instant of its day (23:59:59.999) and
 * return it. Mirrors the previous `d.setHours(23, 59, 59, 999)` pattern,
 * so callers can use either `endOfDay(d)` or `const e = endOfDay(new Date(x))`.
 */
export function endOfDay(d: Date): Date {
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Parse an optional `{ from?, to? }` string pair into Date bounds.
 *
 * - `from` is parsed as-is (start of that day, as encoded).
 * - `to` is adjusted to end-of-day so the upper bound is inclusive.
 *
 * Returns an empty object when neither bound is provided.
 */
export function parseDateRange(input: {
  from?: string | null;
  to?: string | null;
}): { from?: Date; to?: Date } {
  const result: { from?: Date; to?: Date } = {};
  if (input.from) result.from = new Date(input.from);
  if (input.to) result.to = endOfDay(new Date(input.to));
  return result;
}
