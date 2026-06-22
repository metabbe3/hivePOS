import { SAAS_PAYMENT_METHODS } from "@/lib/landing-data-saas";

export function PaymentMarquee() {
  // Duplicate for seamless loop
  const items = [...SAAS_PAYMENT_METHODS, ...SAAS_PAYMENT_METHODS];

  return (
    <section className="border-b border-zinc-200 bg-white py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-5 text-center text-xs font-bold uppercase tracking-wider text-zinc-400">
          Mendukung Pembayaran Lokal
        </p>
      </div>

      {/* Marquee track */}
      <div className="marquee-mask marquee-pause overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-4 pr-4">
          {items.map((method, i) => (
            <span
              key={`${method}-${i}`}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-6 py-2.5 font-display text-base font-bold text-zinc-500 shadow-sm"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
