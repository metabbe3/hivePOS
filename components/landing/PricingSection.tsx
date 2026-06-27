import Link from "next/link";
import { Check, Star, TrendingUp } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { SAAS_PRICING } from "@/lib/landing-data-saas";

export function PricingSection() {
  return (
    <section
      id="harga"
      className="border-y border-zinc-200 bg-surface-muted py-14 sm:py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 shadow-sm">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold">Harga Transparan</span>
            </div>
            <h2 className="mb-4 font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              Harga Jujur,{" "}
              <span className="text-indigo-600">
                Tanpa Kontrak
              </span>
            </h2>
            <p className="text-lg text-zinc-600">
              Per outlet, bukan per user. Semua staff di outlet itu ikut tercover. Upgrade kapan saja.
            </p>
          </div>
        </ScrollReveal>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-6xl items-start gap-6 md:grid-cols-3">
          {SAAS_PRICING.map((plan, idx) => (
            <ScrollReveal
              key={plan.name}
              delay={(idx + 1) as 1 | 2 | 3}
              className={plan.highlight ? "md:-translate-y-2" : ""}
            >
              <div
                className={`relative h-full rounded-3xl transition-all duration-300 ${
                  plan.highlight
                    ? "bg-gradient-to-b from-indigo-500 to-indigo-700 p-[2px] shadow-2xl shadow-indigo-600/20"
                    : "border-2 border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg"
                }`}
              >
                <div
                  className={`relative h-full rounded-3xl p-6 sm:p-8 ${
                    plan.highlight ? "bg-white" : ""
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-indigo-600 px-4 py-1 text-xs font-black uppercase tracking-wide text-white shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                      Paling Populer
                    </div>
                  )}

                  <h3 className="mb-1 font-display text-2xl font-extrabold text-zinc-900">
                    {plan.name}
                  </h3>
                  <p className="mb-6 text-sm text-zinc-500">{plan.desc}</p>

                  <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {plan.originalPrice && (
                      <span className="font-display text-xl font-bold text-zinc-400 line-through price">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="font-display text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl price">
                      {plan.price}
                    </span>
                    <span className="font-semibold text-zinc-400">
                      {plan.period}
                    </span>
                    {plan.discount && (
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-black uppercase tracking-wide text-white">
                        {plan.discount}
                      </span>
                    )}
                  </div>

                  <ul className="mb-8 mt-6 space-y-3">
                    {plan.features.map((feature) => {
                      const isUnlimited = /^Unlimited\s/.test(feature);
                      return (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-zinc-700"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                            <Check
                              className="h-3 w-3 text-secondary"
                              strokeWidth={3}
                            />
                          </span>
                          <span className={isUnlimited ? "font-bold text-zinc-900" : ""}>
                            {feature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Link
                    href="/register"
                    className={`block rounded-full py-3.5 text-center font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      plan.highlight
                        ? "bg-secondary text-white shadow-lg shadow-secondary/25 hover:brightness-95"
                        : "border-2 border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Microcopy — the real billing model */}
        <ScrollReveal delay={3}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-zinc-500">
            Harga per <strong className="font-semibold text-zinc-700">outlet</strong>, bukan per user.
            Semua staff di outlet tersebut ikut ter-cover. Bisa upgrade kapan saja.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
