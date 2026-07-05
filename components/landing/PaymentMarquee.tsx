import { SAAS_PAYMENT_METHODS } from "@/lib/landing-data-saas";

/**
 * Clean static row of supported payment methods — no marquee, no pill cards,
 * no shadows. Plain wordmarks in muted slate. One accent, editorial.
 */
export function PaymentMarquee() {
  return (
    <section className="border-b border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          Pembayaran lokal didukung
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {SAAS_PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="font-display text-base font-bold text-slate-400"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
