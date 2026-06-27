import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

// ponytail: replaces fake testimonials. Founder's-own-laundry angle is the
// strongest trust signal we have — no need to fabricate quotes.
// Offer aligned with billing model: 1 outlet free forever (lib/billing.ts).
export function BetaPartnerCTA() {
  return (
    <section className="border-y border-zinc-200 bg-gradient-to-b from-white to-indigo-50/40 py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <ScrollReveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
            Dipakai Sendiri
          </span>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
            Dibuat di laundry kami, siap untuk laundry Anda
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            hivePOS aktif dipakai di{" "}
            <strong className="font-semibold text-zinc-900">laundry partner kami</strong>{" "}
            sejak Juni 2026. Setiap fitur kami tes di operasional nyata sebelum
            dirilis —{" "}
            <strong className="font-semibold text-zinc-900">gratis 1 outlet selamanya</strong>,
            feedback langsung ke kami, bukan tiket support yang hilang.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={3}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-10"
            >
              Mulai Gratis
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
