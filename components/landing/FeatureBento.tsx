import { Zap } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { SAAS_FEATURES } from "@/lib/landing-data-saas";

function MiniChart() {
  return (
    <div className="mt-4 flex h-12 items-end justify-between gap-1 opacity-70 sm:h-16">
      {[30, 50, 40, 70, 55, 85, 60, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-gradient-to-t from-indigo-200 to-indigo-400"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function FauxReceipt() {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-3 opacity-70">
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>hivePOS Receipt</span>
          <span>#HBL-0001</span>
        </div>
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Laundry Kiloan 5kg</span>
            <span className="font-bold text-zinc-600">Rp 25.000</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-dashed border-zinc-200 pt-1.5 text-[10px] font-bold">
          <span className="text-zinc-700">Total</span>
          <span className="text-indigo-600">Rp 25.000</span>
        </div>
      </div>
    </div>
  );
}

export function FeatureBento() {
  return (
    <section
      id="fitur"
      className="border-y border-zinc-200 bg-surface-muted py-14 sm:py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 shadow-sm">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold">Fitur Lengkap</span>
            </div>
            <h2 className="mb-4 font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              Semua yang Anda Butuhkan untuk{" "}
              <span className="text-indigo-600">
                Skalakan Bisnis
              </span>
            </h2>
            <p className="text-lg text-zinc-600">
              Dari kasir harian sampai laporan multi-outlet. Semua included.
            </p>
          </div>
        </ScrollReveal>

        {/* Bento grid */}
        <div className="grid auto-rows-fr gap-4 md:grid-cols-4">
          {SAAS_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            const delay = ((idx % 4) + 1) as 1 | 2 | 3 | 4;
            return (
              <ScrollReveal
                key={feature.title}
                delay={delay}
                className={feature.span}
              >
                <article className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5">
                  {/* Icon */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-white text-indigo-600 transition-all duration-300 group-hover:from-indigo-600 group-hover:to-indigo-700 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mb-2 font-display text-lg font-bold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600">
                    {feature.desc}
                  </p>

                  {/* Decorative visual for spanning cards */}
                  {feature.visual === "chart" && <MiniChart />}
                  {feature.visual === "receipt" && <FauxReceipt />}
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
