// ponytail: RFC 4180 CSV. Escapes quotes by doubling, wraps fields with comma/quote/newline in double quotes.
// No streaming — exports are bounded (≤10k rows). For larger, switch to a stream API.
export function toCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escape = (v: string | number | boolean | null | undefined): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ponytail: CSV routes return text/csv, not the JSON envelope. We can't use withErrorHandler
// (which types its return as NextResponse<SuccessEnvelope>). This wrapper gives the same
// auth/validation/error semantics but returns a Response. Errors come back as JSON envelopes
// so the client CsvExportButton can surface them via toast.
export function csvHandler(
  fn: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req) => {
    try {
      return await fn(req);
    } catch (e) {
      const status = csvStatusFor(e);
      const message = e instanceof Error ? e.message : "Export failed";
      return Response.json(
        { error: { code: "EXPORT_ERROR", message } },
        { status },
      );
    }
  };
}

// Local mirror of AppError → HTTP status, avoids importing the error classes
// (keeps this module side-effect-free for easy reuse).
function csvStatusFor(e: unknown): number {
  const name = e?.constructor?.name;
  switch (name) {
    case "UnauthenticatedError": return 401;
    case "ForbiddenError": return 403;
    case "ValidationError":
    case "NotFoundError": return 400;
    case "ConflictError": return 409;
    default: return 500;
  }
}
