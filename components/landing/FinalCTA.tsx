import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-zinc-200 bg-indigo-600 py-14 sm:py-20 md:py-28">
      {/* Animated gradient mesh */}
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          background:
            "linear-gradient(120deg, #1d4ed8 0%, #2563eb 30%, #3b82f6 60%, #1d4ed8 100%)",
        }}
        aria-hidden="true"
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      {/* Floating glass orbs */}
      <div
        className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <h2 className="mb-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
            Siap Mengembangkan Bisnis Anda?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-indigo-100">
            Laundry kami sendiri sudah pakai hivePOS sejak Juni 2026. Sekarang
            giliran Anda. Gratis 14 hari. Tanpa kartu kredit.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-indigo-600 shadow-2xl transition-all duration-200 hover:bg-indigo-50 hover:shadow-indigo-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600 sm:w-auto sm:px-10"
            >
              Daftar Sekarang
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a
              href="https://wa.me/6285121309381?text=Halo%20saya%20tertarik%20dengan%20hivePOS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-indigo-300 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600 sm:w-auto sm:px-10"
            >
              <MessageCircle className="h-5 w-5" />
              Chat WhatsApp
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
