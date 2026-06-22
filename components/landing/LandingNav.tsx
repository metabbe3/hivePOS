"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/public/brand-logo";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { SAAS_NAV_LINKS } from "@/lib/landing-data-saas";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-card border-b border-zinc-200/60"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-between px-6 transition-all duration-300 ${
          scrolled ? "h-16 max-w-6xl" : "h-20 max-w-6xl"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-xl font-extrabold font-display tracking-tight text-zinc-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            <BrandMark className="h-5 w-5" />
          </span>
          <span>
            hive<span className="text-indigo-600">POS</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {SAAS_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors duration-200 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {link.label}
              <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-secondary transition-all duration-300 hover:w-[calc(100%-2rem)]" />
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-zinc-600 transition-colors duration-200 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-3 py-2 sm:inline-block"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="hidden rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:inline-flex sm:items-center"
          >
            Daftar Bisnis
          </Link>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    aria-label="Buka menu"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-white pt-14 px-6">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl font-extrabold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
                      <BrandMark className="h-4 w-4" />
                    </span>
                    hive<span className="text-indigo-600">POS</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {SAAS_NAV_LINKS.map((link) => (
                    <SheetClose
                      key={link.href}
                      render={
                        <a
                          href={link.href}
                          className="rounded-xl px-4 py-3.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        />
                      }
                    >
                      {link.label}
                    </SheetClose>
                  ))}
                  <div className="mt-6 flex flex-col gap-3">
                    <Link
                      href="/login"
                      className="rounded-full border-2 border-zinc-200 py-3 text-center text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-full bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700"
                    >
                      Daftar Bisnis
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
