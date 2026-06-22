import { withErrorHandler, parseBody, apiSuccess, apiCreated } from "@/modules/shared";
import { requireWithBranchOrThrow } from "@/lib/permissions/check";
import { orderSchema } from "@/lib/validations";
import {
  createOrderService,
  listOrdersService,
} from "@/modules/orders/orders.module";
import type { CreateOrderInput, ListOrdersInput } from "@/modules/orders/application/dto";

export const GET = withErrorHandler(async (req) => {
  const ctx = await requireWithBranchOrThrow("orders", "read");

  const { searchParams } = new URL(req.url);
  const input: ListOrdersInput = {};
  for (const key of [
    "status",
    "search",
    "page",
    "limit",
    "sortBy",
    "sortOrder",
    "paymentStatus",
    "dateFrom",
    "dateTo",
  ]) {
    const val = searchParams.get(key);
    if (val) (input as Record<string, string>)[key] = val;
  }

  const result = await listOrdersService.execute(input, ctx);

  return apiSuccess(result.orders, {
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await requireWithBranchOrThrow("orders", "create");
  const input = await parseBody(req, orderSchema);

  const order = await createOrderService.execute(input as CreateOrderInput, ctx);

  return apiCreated(order);
});
