import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { fontSans, fontDisplay, fontSerif } from "@/lib/fonts";
import { ConfirmProvider } from "@/components/shared/confirm-dialog";
import "./globals.css";

const SITE_URL = "https://hivepos.id";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "hivePOS — Aplikasi Kasir Online untuk Laundry",
    template: "%s | hivePOS",
  },
  description:
    "Sistem kasir online untuk bisnis laundry di Indonesia. Kelola pesanan kiloan & satuan, kanban status, deposit wallet, dan laporan keuangan dalam satu aplikasi. Coba gratis 3 bulan.",
  keywords: [
    "aplikasi kasir laundry murah",
    "software kasir 49 ribu",
    "aplikasi kasir laundry kiloan",
    "pos laundry multi cabang",
    "aplikasi kasir online",
    "sistem kasir laundry",
    "software kasir gratis",
    "aplikasi kasir UMKM",
    "cuci sepatu kasir online",
    "cuci bedcover laundry software",
    "kasir online terintegrasi",
    "point of sale Indonesia",
  ],
  authors: [{ name: "hivePOS" }],
  creator: "hivePOS",
  publisher: "hivePOS",
  alternates: {
    canonical: "/",
    languages: {
      "id-ID": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "hivePOS",
    title: "hivePOS — Aplikasi Kasir Online untuk Laundry",
    description:
      "Sistem kasir online untuk laundry. Kelola pesanan, pembayaran, dan laporan dalam satu platform. Coba gratis 3 bulan.",
    // Image resolved by app/opengraph-image.tsx (file convention).
  },
  twitter: {
    card: "summary_large_image",
    title: "hivePOS — Aplikasi Kasir Online untuk Laundry",
    description:
      "Sistem kasir online untuk laundry. Kelola operasional bisnis dalam satu platform.",
    // Image resolved by app/twitter-image.tsx (file convention).
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // icons + apple icon resolved by app/icon.tsx and app/apple-icon.tsx.
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontSerif.variable}`}
    >
      <head>
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=location.pathname;var isLanding=p==='/'||p==='/register'||p==='/login'||p.startsWith('/track')||p.startsWith('/pickup')||p.startsWith('/support');var t=localStorage.getItem('theme');if(!isLanding&&(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)))document.documentElement.classList.add('dark')}catch{}`,
          }}
        />
        {/* JSON-LD: Organization + SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "hivePOS",
                  url: SITE_URL,
                  description:
                    "Aplikasi kasir laundry dari Indonesia. Aktif dipakai di laundry partner sejak Juni 2026.",
                  foundingDate: "2025",
                  knowsLanguage: "id",
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: "ID",
                    addressRegion: "DKI Jakarta",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  name: "hivePOS",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web Browser",
                  browserRequirements: "Requires a modern web browser",
                  url: SITE_URL,
                  description:
                    "Sistem kasir online untuk bisnis laundry di Indonesia.",
                  offers: [
                    {
                      "@type": "Offer",
                      name: "Free",
                      price: "0",
                      priceCurrency: "IDR",
                      description: "1 Outlet, 2 Staff, 100 order/bulan, modul laundry",
                    },
                    {
                      "@type": "Offer",
                      name: "Growth",
                      price: "49000",
                      priceCurrency: "IDR",
                      description: "Per outlet/bulan. Tambah outlet kapan saja. Unlimited staff dan order. Semua modul.",
                    },
                  ],
                  featureList: [
                    "Manajemen pesanan & antrian",
                    "Multi-outlet dashboard",
                    "Laporan real-time",
                    "Integrasi QRIS & e-wallet",
                    "Struk thermal printer",
                    "Manajemen pelanggan (CRM)",
                    "Inventori otomatis",
                    "Role-based access control",
                  ],
                },
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "Apakah hivePOS gratis?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Ya, hivePOS memiliki paket gratis permanen untuk 1 outlet dengan 100 order per bulan. Untuk fitur lebih, paket Growth hanya Rp 49.000 per outlet per bulan dan bisa dicoba gratis 14 hari tanpa kartu kredit.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Bisnis apa saja yang bisa menggunakan hivePOS?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "hivePOS saat ini fokus penuh mendukung bisnis laundry (kiloan, satuan, express, sepatu, bedcover).",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Apakah hivePOS bisa untuk multiple outlet?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Ya, hivePOS mendukung multi-outlet. Paket Growth seharga Rp 49.000 per outlet per bulan — bisa tambah outlet kapan saja dengan dashboard terpusat. Paket Free tersedia permanen untuk 1 outlet.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Bagaimana cara pembayaran di hivePOS?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "hivePOS mendukung pembayaran tunai (cash), transfer bank, QRIS, dan e-wallet (GoPay, OVO, DANA, ShopeePay). Integrasi pembayaran Midtrans tersedia untuk pembayaran otomatis.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <main id="main">
          <ConfirmProvider>{children}</ConfirmProvider>
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
