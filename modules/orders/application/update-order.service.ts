import {
  NotFoundError,
  BusinessRuleError,
} from "@/modules/shared";
import type {
  OrderRepository,
  ReplaceOrderData,
} from "../domain/repository.port";
import { priceOrder } from "../domain/pricing";
import {
  generateOrderNumber,
  orderNumberPrefix,
  parseSequence,
} from "../domain/order-number.vo";
import { deriveTenantCode } from "@/lib/tenant-code";
import type { ServiceCatalogPort, TenantPort } from "./ports";
import type { RequestContext } from "./context";
import type { UpdateOrderInput } from "./dto";

export class UpdateOrderService {
  constructor(
    private orderRepo: OrderRepository,
    private serviceCatalog: ServiceCatalogPort,
    private tenantPort: TenantPort,
  ) {}

  async execute(
    orderId: string,
    input: UpdateOrderInput,
    ctx: RequestContext,
  ) {
    // ── 1. Load existing order with payments ──
    const existing = await this.orderRepo.findDetailById(orderId, ctx.branchId);
    if (!existing) {
      throw new NotFoundError("Order", orderId);
    }

    // ── 2. Guard: delivered orders are immutable ──
    if (existing.status === "DELIVERED") {
      throw new BusinessRuleError("Cannot edit delivered orders");
    }

    // ── 3. Guard: can't change customer when deposit payments exist ──
    const hasDepositPayments = existing.payments.some(
      (p) => p.paymentMethod === "DEPOSIT",
    );
    if (hasDepositPayments && input.customerId !== existing.customerId) {
      throw new BusinessRuleError(
        "Cannot change customer: order has deposit payments",
      );
    }

    // ── 4. Fetch services and validate ──
    const serviceIds = input.items.map((i) => i.serviceId);
    const services = await this.serviceCatalog.findPricingForServices(
      serviceIds,
      ctx.branchIds,
    );
    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const missing = serviceIds.filter((id) => !serviceMap.has(id));
    if (missing.length > 0) {
      throw new NotFoundError(`Services not found: ${missing.join(", ")}`);
    }

    // ── 5. Recalculate pricing ──
    const pricing = priceOrder(
      input.items,
      serviceMap,
      input.discountType,
      input.discountAmount,
    );

    // ── 6. Regenerate order number if receivedAt changed ──
    const newReceivedAt = input.receivedAt ? new Date(input.receivedAt) : null;
    let newOrderNumber: string | undefined;

    if (newReceivedAt) {
      // ponytail: load tenant slug once for both old/new prefix compare.
      const tenantSlug = await this.tenantPort.getSlug(ctx.tenantId);
      const tenantCode = deriveTenantCode(tenantSlug ?? "ord");
      const oldDateStr = existing.receivedAt
        ? orderNumberPrefix(existing.receivedAt, tenantCode)
        : "";
      const newPrefix = orderNumberPrefix(newReceivedAt, tenantCode);

      if (newPrefix !== oldDateStr) {
        const lastSeq = await this.orderRepo.getLastSequenceForPrefix(newPrefix);
        newOrderNumber = generateOrderNumber(newReceivedAt, lastSeq, tenantCode);
      }
    }

    // ── 7. Persist (repository handles item replacement + payment recalc) ──
    const data: ReplaceOrderData = {
      customerId: input.customerId,
      totalAmount: pricing.totalAmount.amount,
      discountAmount: pricing.discount.amount,
      discountType: input.discountType ?? null,
      notes: input.notes ?? null,
      receivedAt: newReceivedAt,
      ...(newOrderNumber ? { orderNumber: newOrderNumber } : {}),
      items: pricing.items,
    };

    return this.orderRepo.replaceItems(orderId, ctx.branchId, data);
  }
}
