"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { SAAS_FAQS } from "@/lib/landing-data-saas";

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section id="faq" className="bg-white py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <ScrollReveal>
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 shadow-sm">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold">FAQ</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              Pertanyaan{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-secondary bg-clip-text text-transparent">
                Sering Ditanyakan
              </span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="space-y-3">
            {SAAS_FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              const panelId = `saas-faq-panel-${i}`;
              const buttonId = `saas-faq-button-${i}`;

              return (
                <div
                  key={i}
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? "border-indigo-200 bg-white shadow-lg shadow-indigo-900/5"
                      : "border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md"
                  }`}
                >
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    <span
                      className={`text-base font-bold transition-colors duration-200 sm:text-lg ${
                        isOpen ? "text-indigo-600" : "text-zinc-900"
                      }`}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isOpen ? "rotate-180 bg-indigo-50" : "bg-zinc-100"
                      }`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-colors duration-300 ${
                          isOpen ? "text-indigo-600" : "text-zinc-400"
                        }`}
                      />
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    // ponytail: dropped grid-rows transition (non-composited) —
                    // instant toggle instead. ChevronDown rotation already signals state.
                    className={isOpen ? "block" : "hidden"}
                  >
                    <p className="px-6 pb-5 leading-relaxed text-zinc-600">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
