import Link from "next/link";
import { ArrowRight, Check, X, Sparkles } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import {
  WEBSITE_FEATURES,
  WEBSITE_FEATURE_GROUPS,
} from "@/lib/landing-data-saas";

/**
 * ponytail: static faux-browser mockup instead of a screenshot or live iframe.
 * Keeps the bundle small and avoids tenant-specific data leaking onto the
 * landing page. Swap for a real screenshot when marketing has a polished one.
 */
function BrowserMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-full bg-white px-4 py-1 text-xs text-zinc-400 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          honeybee.hivepos.id
        </div>
      </div>

      {/* Faux site content */}
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <span className="font-display text-sm font-extrabold text-zinc-900">
            Honey Bee Laundry
          </span>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
            Buka Sekarang
          </span>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            Laundry Kiloan &amp; Satuan
          </div>
          <div className="mt-1 font-display text-lg font-extrabold leading-tight text-zinc-900">
            Bersih, wangi, tepat waktu.
          </div>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-indigo-700 shadow-sm">
              Tracking Pesanan
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-indigo-700 shadow-sm">
              WhatsApp Order
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {["4.9 ★", "2 hari", "Antar-Jemput"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-[10px] font-semibold text-zinc-700"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {[
            "Laundry Kiloan — Rp 7.000/kg",
            "Express 7 jam — Rp 15.000/kg",
            "Bedcover — Rp 35.000/pcs",
          ].map((row) => (
            <div
              key={row}
              className="flex justify-between rounded-md bg-zinc-50 px-3 py-1.5 text-[10px] text-zinc-600"
            >
              <span>{row.split(" — ")[0]}</span>
              <span className="font-bold text-zinc-800">{row.split(" — ")[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TierCell({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl p-3 ${
        value
          ? "bg-gradient-to-b from-indigo-50 to-white ring-1 ring-indigo-200"
          : "bg-zinc-50"
      }`}
    >
      <span className="text-xs font-bold text-zinc-700">{label}</span>
      {value ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
          <X className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}

export function WebsiteSpotlight() {
  const featuresByGroup = WEBSITE_FEATURE_GROUPS.map(({ name, icon: GroupIcon }) => ({
    name,
    GroupIcon,
    items: WEBSITE_FEATURES.filter((f) => f.group === name),
  }));

  return (
    <section
      id="website"
      className="border-y border-zinc-200 bg-white py-14 sm:py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-indigo-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-bold">Eksklusif Pro</span>
            </div>
            <h2 className="mb-4 font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              Website Laundry Profesional,{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-secondary bg-clip-text text-transparent">
                Secara Otomatis
              </span>
            </h2>
            <p className="text-lg text-zinc-600">
              Dari subdomain sampai SEO Google. Semua siap pakai untuk menarik
              pelanggan baru — tanpa ribet coding atau sewa developer.
            </p>
          </div>
        </ScrollReveal>

        {/* Two-column hero */}
        <ScrollReveal delay={2}>
          <div className="mb-14 grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="space-y-5">
              <p className="text-base leading-relaxed text-zinc-700">
                Setiap outlet di hivePOS bisa punya website sendiri di{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-indigo-700">
                  slug.hivepos.id
                </code>
                . Otomatis terisi data layanan, harga, jam buka, dan testimoni
                dari dashboard Anda.
              </p>
              <ul className="space-y-2 text-sm text-zinc-700">
                {[
                  "Update harga & layanan dari dashboard — langsung tersinkron",
                  "Pelanggan lacak pesanan tanpa chat admin",
                  "Google mengindeks alamat, jam buka, dan rating otomatis",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <Check className="h-3 w-3 text-indigo-700" strokeWidth={3} />
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:brightness-105"
              >
                Coba Pro 14 Hari Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <BrowserMockup />
          </div>
        </ScrollReveal>

        {/* Feature grid grouped */}
        <div className="grid gap-5 md:grid-cols-2">
          {featuresByGroup.map(({ name, GroupIcon, items }, idx) => (
            <ScrollReveal key={name} delay={((idx % 2) + 1) as 1 | 2}>
              <div className="h-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-white text-indigo-600">
                    <GroupIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-zinc-900">
                    {name}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {items.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <li key={feature.title} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-zinc-900">
                            {feature.title}
                          </div>
                          <div className="text-xs leading-relaxed text-zinc-600">
                            {feature.desc}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Comparison strip */}
        <ScrollReveal delay={3}>
          <div className="mt-12 rounded-3xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-6 sm:p-10">
            <div className="mb-6 text-center">
              <h3 className="font-display text-2xl font-extrabold text-zinc-900">
                Hanya di Pro
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Tidak tersedia di paket Free &amp; Growth
              </p>
            </div>
            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
              <TierCell label="Free" value={false} />
              <TierCell label="Growth" value={false} />
              <TierCell label="Pro" value={true} />
            </div>
            <p className="mt-6 text-center text-xs text-zinc-500">
              Upgrade ke Pro kapan saja dari dashboard. Harga sama dengan Growth,
              plus seluruh fitur website di atas.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
