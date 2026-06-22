import { ArrowRight, UserPlus, Settings, ShoppingCart } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { SAAS_HOW_IT_WORKS } from "@/lib/landing-data-saas";

const STEP_ICONS = [UserPlus, Settings, ShoppingCart];

export function HowItWorks() {
  return (
    <section className="bg-white py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal>
          <h2 className="mb-10 text-center font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:mb-16 sm:text-4xl md:text-5xl">
            Mulai dalam{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-secondary bg-clip-text text-transparent">
              3 Langkah
            </span>
          </h2>
        </ScrollReveal>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {SAAS_HOW_IT_WORKS.map((step, idx) => {
            const Icon = STEP_ICONS[idx] ?? UserPlus;
            return (
              <ScrollReveal key={step.num} delay={(idx + 1) as 1 | 2 | 3}>
                <div className="group relative text-center">
                  {/* Large gradient number */}
                  <p className="mb-2 font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl md:text-7xl">
                    <span className="bg-gradient-to-br from-indigo-300 via-indigo-400 to-secondary/60 bg-clip-text text-transparent">
                      {step.num}
                    </span>
                  </p>

                  {/* Icon card */}
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-100 bg-white shadow-lg shadow-zinc-900/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-900/10">
                    <Icon className="h-7 w-7 text-indigo-600" />
                  </div>

                  <h3 className="mb-2 font-display text-xl font-bold text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-zinc-600">
                    {step.desc}
                  </p>

                  {/* Connector arrow (desktop) */}
                  {idx < SAAS_HOW_IT_WORKS.length - 1 && (
                    <div className="absolute -right-4 top-12 hidden lg:block">
                      <ArrowRight className="h-6 w-6 text-zinc-200 transition-colors duration-300 group-hover:text-indigo-300" />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
