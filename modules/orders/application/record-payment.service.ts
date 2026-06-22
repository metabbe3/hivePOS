import {
  NotFoundError,
  AmountExceedsBalanceError,
  InsufficientBalanceError,
} from "@/modules/shared";
import type {
  OrderRepository,
  PaymentRepository,
} from "../domain/repository.port";
import { Money } from "../domain/money.vo";
import type { RequestContext } from "./context";
import type { RecordPaymentInput } from "./dto";

export class RecordPaymentService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  async execute(
    orderId: string,
    input: RecordPaymentInput,
    ctx: RequestContext,
  ) {
    // ── 1. Load order with details (need total, paid, customer) ──
    const order = await this.orderRepo.findDetailById(orderId, ctx.branchId);
    if (!order) {
      throw new NotFoundError("Order", orderId);
    }

    // ── 2. Guard: payment amount must not exceed remaining balance ──
    const total = new Money(order.totalAmount);
    const alreadyPaid = new Money(order.paidAmount);
    const remaining = total.subtract(alreadyPaid);

    if (new Money(input.amount).isGreaterThan(remaining)) {
      throw new AmountExceedsBalanceError();
    }

    // ── 3. Guard: DEPOSIT requires sufficient customer wallet balance ──
    if (input.paymentMethod === "DEPOSIT") {
      const walletBalance = new Money(order.customerBalance);
      if (walletBalance.isLessThan(input.amount)) {
        throw new InsufficientBalanceError();
      }
    }

    // ── 4. Record payment (repository handles the cross-aggregate tx) ──
    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    const result = await this.paymentRepo.recordPayment(
      {
        orderId,
        branchId: ctx.branchId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? null,
        paidAt,
      },
      order.customerId,
    );

    return result;
  }
}
