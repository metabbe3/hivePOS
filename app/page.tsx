import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { PaymentMarquee } from "@/components/landing/PaymentMarquee";
import { IndustriesSection } from "@/components/landing/IndustriesSection";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { WebsiteSpotlight } from "@/components/landing/WebsiteSpotlight";
import { BetaPartnerCTA } from "@/components/landing/BetaPartnerCTA";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SAAS_FAQS } from "@/lib/landing-data-saas";
import { BLOG_POST_CARDS } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "hivePOS — Kasir Laundry Online | Alternatif Moka POS untuk UMKM",
  description:
    "Aplikasi kasir laundry termurah untuk UMKM Indonesia. Browser-native, tanpa install. Kiloan, satuan, WhatsApp order, multi-outlet. Gratis 1 outlet. Alternatif Moka POS mulai Rp 49K/outlet.",
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SAAS_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "hivePOS",
  description: "Aplikasi kasir laundry untuk UMKM Indonesia. Browser-native, tanpa install. Kiloan, satuan, WhatsApp order, multi-outlet.",
  url: "https://hivepos.id",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "IDR", description: "Free — 1 outlet, 2 staff, 100 order/bulan" },
    { "@type": "Offer", price: "49000", priceCurrency: "IDR", description: "Growth — Rp 49K/outlet/bulan, unlimited" },
    { "@type": "Offer", price: "79000", priceCurrency: "IDR", description: "Pro — Rp 79K/outlet/bulan, website + foto bukti" },
  ],
  featureList: [
    "Kasir laundry kiloan, satuan, express",
    "Cetak struk thermal (Bluetooth/USB/WiFi)",
    "WhatsApp order + template pesanan",
    "Multi-outlet dengan dashboard terpisah",
    "Manajemen pelanggan + dompet deposit",
    "Pickup/antar-jemput gratis",
    "PWA: install di HP, order offline",
    "Website laundry sendiri (Pro)",
    "Bukti foto order (Pro)",
  ],
};

export default function LandingPage() {
  return (
    <div className="pub-scope min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingNav />
      <div>
        <LandingHero />
        <PaymentMarquee />
        <IndustriesSection />
        <FeatureBento />
        <HowItWorks />
        <PricingSection />
        {/* Internal SEO link — keyword-rich anchor to the comparison page */}
        <div className="border-t border-slate-200 bg-white py-5 text-center">
          <Link
            href="/alternatif-moka-pos-laundry"
            className="text-sm font-semibold text-brand hover:underline"
          >
            Sedang cari alternatif Moka POS untuk laundry? → Lihat perbandingan lengkap hivePOS vs Moka POS
          </Link>
        </div>
        <WebsiteSpotlight />
        <BetaPartnerCTA />
        <LandingFAQ />

        {/* Artikel Terbaru — internal links from the homepage de-orphan the blog
            so Google crawls it (otherwise the blog is reachable only via sitemap). */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Artikel Terbaru
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Tips &amp; panduan bisnis laundry dari tim hivePOS.
                </p>
              </div>
              <Link
                href="/blog"
                className="hidden rounded-md text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:inline-block"
              >
                Lihat semua →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BLOG_POST_CARDS.slice(0, 6).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <h3 className="font-semibold text-slate-900">{post.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-brand">Baca →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
      </div>
      <LandingFooter />
    </div>
  );
}
