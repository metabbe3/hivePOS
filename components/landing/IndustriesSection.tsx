import { Check, Layers } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { SAAS_INDUSTRIES } from "@/lib/landing-data-saas";

export function IndustriesSection() {
  return (
    <section id="modul" className="bg-white py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 shadow-sm">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold">Modul Bisnis</span>
            </div>
            <h2 className="mb-4 font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              Dibuat Spesifik untuk{" "}
              <span className="text-indigo-600">
                Setiap Industri
              </span>
            </h2>
            <p className="text-lg text-zinc-600">
              Bukan POS generic. Setiap modul punya workflow dan pricing engine
              yang dirancang khusus.
            </p>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {SAAS_INDUSTRIES.map((industry, idx) => {
            const Icon = industry.icon;
            return (
              <ScrollReveal key={industry.name} delay={(idx + 1) as 1 | 2 | 3}>
                <article className="group h-full rounded-3xl border-2 border-zinc-100 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5 sm:p-8">
                  {/* Icon */}
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-white text-indigo-600 transition-all duration-300 group-hover:scale-105 group-hover:from-indigo-600 group-hover:to-indigo-700 group-hover:text-white">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="font-display text-xl font-extrabold text-zinc-900 sm:text-2xl">
                      {industry.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        industry.available
                          ? "bg-secondary/15 text-secondary"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {industry.status}
                    </span>
                  </div>

                  <p className="mb-6 text-sm font-medium text-zinc-500">
                    {industry.tagline}
                  </p>

                  <ul className="space-y-2.5">
                    {industry.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-zinc-700"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                          <Check
                            className="h-3 w-3 text-indigo-600"
                            strokeWidth={3}
                          />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
