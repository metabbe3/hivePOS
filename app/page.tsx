import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "hivePOS — Aplikasi Kasir Online untuk Laundry",
  description:
    "Sistem kasir online untuk bisnis laundry di Indonesia. Kelola pesanan kiloan & satuan, kanban status, deposit wallet, dan laporan keuangan dalam satu aplikasi. Coba gratis 3 bulan.",
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="pub-scope min-h-screen">
      <LandingNav />
      <main>
        <LandingHero />
        <PaymentMarquee />
        <IndustriesSection />
        <FeatureBento />
        <HowItWorks />
        <PricingSection />
        <WebsiteSpotlight />
        <BetaPartnerCTA />
        <LandingFAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
