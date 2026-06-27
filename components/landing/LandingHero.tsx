"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles, TrendingUp, Users } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { SAAS_STATS, SAAS_TRUST_BADGES } from "@/lib/landing-data-saas";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

function AnimatedCounter({
  value,
  suffix = "",
  duration = 1500,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [ref, visible] = useScrollReveal<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);

  // ponytail: rAF tween 0 → value on visibility. One rAF chain, no library.
  useEffect(() => {
    if (!visible) {
      setDisplay(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic — feels right for a count-up.
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-white">
      {/* Animated gradient mesh background */}
      <div
        className="absolute inset-0 -z-10 animate-gradient opacity-60"
        style={{
          background:
            "linear-gradient(120deg, #eff6ff 0%, #ffffff 40%, #eff6ff 70%, #ffffff 100%)",
        }}
        aria-hidden="true"
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #0f172a 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />
      {/* Glow — desktop only, muddy on mobile */}
      <div
        className="absolute left-1/2 top-0 -z-10 hidden h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl md:block"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pb-24 sm:pt-16 md:pt-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left column */}
          <div className="lg:col-span-7">
            <ScrollReveal delay={1}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-secondary" />
                <span className="text-sm font-bold text-secondary">
                  hivePOS
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={1}>
              <h1 className="mb-6 font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-zinc-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Kasir laundry,
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-secondary bg-clip-text text-transparent">
                  tinggal buka browser.
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-zinc-600 md:text-xl">
                Tanpa install, tanpa ribet. hivePOS dirancang khusus untuk
                laundry UMKM Indonesia — kiloan, satuan, express, semua di
                satu browser.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-8"
                >
                  Mulai Gratis
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-white/70 px-6 py-4 text-base font-bold text-zinc-700 backdrop-blur-sm transition-all duration-200 hover:border-zinc-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-8"
                >
                  Lihat Demo
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={3}>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {SAAS_TRUST_BADGES.map((badge) => (
                  <li
                    key={badge}
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-600"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/15">
                      <Check className="h-3 w-3 text-secondary" strokeWidth={3} />
                    </span>
                    {badge}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={3}>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-zinc-200/70 bg-white/60 p-4 backdrop-blur-sm">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-emerald-600 text-white">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Dibuat dan dipakai sendiri di laundry kami.
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Kami tau persis ribetnya manual — itu yang kami selesaikan.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right column — floating dashboard mockup */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={3} className="relative">
              <div className="animate-float">
                {/* Main dashboard card */}
                <div className="glass-card rounded-3xl p-6 shadow-2xl shadow-indigo-900/10">
                  {/* Browser chrome */}
                  <div className="mb-5 flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-3 text-xs font-medium text-zinc-400">
                      app.hivepos.id
                    </span>
                  </div>

                  {/* Order label */}
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Order Hari Ini
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
                      18
                    </span>
                    <span className="text-lg font-bold text-zinc-400">order</span>
                  </div>

                  {/* Mini bar chart */}
                  <div className="mt-6 flex h-24 items-end justify-between gap-1.5">
                    {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-500 to-indigo-400"
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>

                  {/* Footer stats */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/60 p-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        <p className="text-xs font-semibold text-zinc-500">
                          Pelanggan
                        </p>
                      </div>
                      <p className="mt-1 font-display text-xl font-extrabold text-zinc-900">
                        <AnimatedCounter value={443} />
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/60 p-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                        <p className="text-xs font-semibold text-zinc-500">
                          Avg / Order
                        </p>
                      </div>
                      <p className="mt-1 font-display text-xl font-extrabold text-zinc-900">
                        Rp&nbsp;<AnimatedCounter value={44} />K
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating proof badge */}
                <div className="absolute -right-3 -top-4 rotate-6 rounded-2xl bg-gradient-to-br from-secondary to-emerald-600 px-4 py-2.5 text-white shadow-xl shadow-emerald-600/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Dipakai Sendiri
                  </p>
                  <p className="font-display text-lg font-extrabold leading-none">
                    hivePOS
                  </p>
                </div>

                {/* Floating bottom card */}
                <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-zinc-100 bg-white p-3 shadow-xl shadow-zinc-900/5 sm:block">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15">
                      <Check className="h-4 w-4 text-secondary" strokeWidth={3} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">
                        QRIS Berhasil
                      </p>
                      <p className="text-[10px] text-zinc-400">Baru saja</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Stats bar */}
        <ScrollReveal delay={2}>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-8 border-t border-zinc-200 pt-8 sm:mt-20 sm:pt-10 md:grid-cols-4">
            {SAAS_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-extrabold text-indigo-600 md:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-xl text-center text-xs text-zinc-400">
            Data real dari{" "}
            <strong className="font-semibold text-zinc-600">
              laundry partner kami
            </strong>{" "}
            — aktif pakai hivePOS sejak Juni 2026.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
