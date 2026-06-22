import { z } from "zod/v4";
import { withErrorHandler, apiCreated, parseBody } from "@/modules/shared";
import { createPublicTicket, TICKET_CATEGORIES } from "@/lib/tickets";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  category: z.enum(TICKET_CATEGORIES).optional(),
  submitterName: z.string().min(1, "Name is required").max(120),
  submitterEmail: z.string().email("Valid email required"),
  submitterPhone: z.string().max(40).optional().or(z.literal("")),
  tenantSlug: z.string().max(80).optional().or(z.literal("")),
});

export const POST = withErrorHandler(async (req) => {
  rateLimit(req, { limit: 10, windowSeconds: 60 });

  const raw = await parseBody(req, ticketSchema);

  // ponytail: tenantSlug is optional; resolve best-effort. Unresolved slug → ticket
  // still created with tenantId=null so we don't lose the complaint.
  let tenantId: string | null = null;
  if (raw.tenantSlug) {
    const t = await prisma.tenant.findUnique({
      where: { slug: raw.tenantSlug },
      select: { id: true },
    });
    tenantId = t?.id ?? null;
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const created = await createPublicTicket({
    subject: raw.subject,
    description: raw.description,
    category: raw.category,
    submitterName: raw.submitterName,
    submitterEmail: raw.submitterEmail,
    submitterPhone: raw.submitterPhone || null,
    tenantId,
    ipAddress,
    userAgent: req.headers.get("user-agent"),
  });

  return apiCreated({ id: created.id });
});
