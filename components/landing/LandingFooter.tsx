import Link from "next/link";
import {
  Building2,
  WashingMachine,
} from "lucide-react";
import { BrandMark } from "@/components/public/brand-logo";

const PRODUCT_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#modul", label: "Modul Bisnis" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

const BUSINESS_MODULES = [
  { icon: WashingMachine, label: "Kasir Laundry" },
  { icon: Building2, label: "Multi-Outlet" },
];

function IndonesianFlag() {
  return (
    <span
      className="inline-flex h-3.5 w-5 overflow-hidden rounded-sm border border-zinc-300 align-middle"
      aria-label="Indonesia"
    >
      <span className="block h-1/2 w-full bg-red-600" />
      <span className="block h-1/2 w-full bg-white" />
    </span>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-surface-muted">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-zinc-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-600/25">
                <BrandMark className="h-4 w-4" />
              </span>
              hive<span className="text-indigo-600">POS</span>
            </Link>
            <p className="max-w-xs text-sm text-zinc-500">
              Aplikasi kasir laundry. Dibuat oleh owner laundry, untuk owner
              laundry.
            </p>
          </div>

          {/* Produk */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
              Produk
            </h4>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-zinc-600 transition-colors duration-200 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Bisnis — Lucide icons instead of emojis */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
              Bisnis
            </h4>
            <ul className="space-y-2.5 text-sm">
              {BUSINESS_MODULES.map((mod) => (
                <li key={mod.label}>
                  <span className="flex items-center gap-2 text-zinc-500">
                    <mod.icon className="h-4 w-4 text-indigo-400" />
                    {mod.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mulai */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
              Mulai
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/register"
                  className="text-zinc-600 transition-colors duration-200 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
                >
                  Daftar Bisnis
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-zinc-600 transition-colors duration-200 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
                >
                  Masuk
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-zinc-600 transition-colors duration-200 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
                >
                  Lacak Order
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 md:flex-row">
          <p className="text-sm text-zinc-400">
            © 2026 hivePOS. Aplikasi Kasir Laundry.
          </p>
          <p className="flex items-center gap-1.5 text-sm text-zinc-400">
            Dibuat di Indonesia <IndonesianFlag />
          </p>
        </div>
      </div>
    </footer>
  );
}
