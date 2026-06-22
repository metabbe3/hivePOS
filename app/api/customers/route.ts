import {
  withErrorHandler,
  parseBody,
  apiSuccess,
  apiCreated,
  type RouteContext,
} from "@/modules/shared";
import { requireWithBranchOrThrow } from "@/lib/permissions/check";
import { customerSchema } from "@/lib/validations";
import { listCustomersService, createCustomerService } from "@/modules/customers/customers.module";
import type { CreateCustomerInput } from "@/modules/customers/application/dto";

export const GET = withErrorHandler(async (req) => {
  const ctx = await requireWithBranchOrThrow("customers", "read");

  const { searchParams } = new URL(req.url);
  const input = {
    search: searchParams.get("search") || undefined,
    sort: (searchParams.get("sort") as any) || undefined,
    order: (searchParams.get("order") as any) || undefined,
    status: (searchParams.get("status") as any) || "",
  };

  const customers = await listCustomersService.execute(input, ctx);

  return apiSuccess(customers);
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await requireWithBranchOrThrow("customers", "create");
  const input = await parseBody(req, customerSchema);

  const customer = await createCustomerService.execute(
    input as CreateCustomerInput,
    ctx,
  );

  return apiCreated(customer);
});
