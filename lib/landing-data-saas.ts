import {
  BarChart3,
  Building2,
  Users,
  Wallet,
  Printer,
  Smartphone,
  Bell,
  Shield,
  Receipt,
  WashingMachine,
  Globe,
  Palette,
  Image as ImageIcon,
  Search,
  MapPin,
  HelpCircle,
  Package,
  MessageCircle,
  QrCode,
  Star,
  Quote,
  Clock,
  Instagram,
  Truck,
  type LucideIcon,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

export interface SaasStat {
  value: string;
  label: string;
}

export interface SaasIndustry {
  icon: LucideIcon;
  name: string;
  tagline: string;
  features: string[];
  status: string;
  available: boolean;
}

export interface SaasFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
  /** Tailwind col-span class for bento layout, e.g. "md:col-span-2". */
  span: string;
  /** Optional decorative visual for spanning cards. */
  visual?: "chart" | "receipt";
}

export interface SaasPricingPlan {
  name: string;
  price: string;
  /** Optional struck-through original price (e.g. "Rp 79K" for Growth). */
  originalPrice?: string;
  /** Optional discount chip text (e.g. "HEMAT 38%"). */
  discount?: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

export interface SaasFaq {
  q: string;
  a: string;
}

export interface SaasStep {
  num: string;
  title: string;
  desc: string;
}

export type WebsiteFeatureGroup =
  | "Branding & Subdomain"
  | "SEO Lokal"
  | "Tracking & Pembayaran"
  | "Kepercayaan & Konten";

export interface WebsiteFeature {
  group: WebsiteFeatureGroup;
  icon: LucideIcon;
  title: string;
  desc: string;
}

/* ─────────────────────────────────────────────────────────────
   Data
   ───────────────────────────────────────────────────────────── */

// ponytail: real snapshot from Honey Bee Laundry (our own dogfooding tenant)
// captured Jun 2026. Hardcoded — not wired live — revisit when numbers shift
// materially (e.g. +50% growth). Skip revenue per founder's call.
export const SAAS_STATS: SaasStat[] = [
  { value: "443", label: "Pelanggan Aktif" },
  { value: "199", label: "Order Total" },
  { value: "Okt 2024", label: "Laundry Berjalan" },
  { value: "Jun 2026", label: "Di hivePOS" },
];

export const SAAS_PAYMENT_METHODS: string[] = [
  "QRIS",
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "BCA",
  "Mandiri",
  "Cash",
];

export const SAAS_INDUSTRIES: SaasIndustry[] = [
  {
    icon: WashingMachine,
    name: "Laundry",
    tagline: "Kiloan, satuan, express",
    features: [
      "Pricing per kg, per item, atau paket",
      "Kanban board status tracking",
      "Deposit wallet untuk pelanggan",
      "SLA tracker untuk order express",
      "WhatsApp order button",
    ],
    status: "Tersedia",
    available: true,
  },
  // ponytail: FnB and Salon entries removed from landing — focus brand on laundry
  // until those modules ship. Re-add here (and in LandingFooter) when ready.
];

export const SAAS_FEATURES: SaasFeature[] = [
  {
    icon: BarChart3,
    title: "Dashboard Real-time",
    desc: "Revenue, order volume, performa outlet. Sparklines, charts, heatmap — semua otomatis di satu layar.",
    span: "md:col-span-2",
    visual: "chart",
  },
  {
    icon: Building2,
    title: "Multi-Outlet",
    desc: "Bisa tambah cabang kapan saja. Per-outlet stats dan staff.",
    span: "",
  },
  {
    icon: Wallet,
    title: "Semua Metode Bayar",
    desc: "Cash, QRIS, GoPay, OVO, DANA, transfer, deposit.",
    span: "",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    desc: "Owner lihat semua. Kasir hanya bikin order. Granular control.",
    span: "",
  },
  {
    icon: Printer,
    title: "Thermal Printer",
    desc: "Print struk 58mm/80mm langsung dari browser. Auto-detect printer di jaringan. Custom logo & footer.",
    span: "md:col-span-2",
    visual: "receipt",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    desc: "Tablet, HP, desktop. Responsive 100%.",
    span: "",
  },
  {
    icon: Bell,
    title: "WhatsApp Order Button",
    desc: "Pelanggan pesan langsung via tombol WhatsApp — tanpa install, tanpa biaya API.",
    span: "",
  },
  {
    icon: Shield,
    title: "Aman & Terenkripsi",
    desc: "Password hashing, JWT, input validation, tenant isolation.",
    span: "",
  },
  {
    icon: Receipt,
    title: "Piutang Tracking",
    desc: "Lacak siapa belum bayar. Alert otomatis. Reminder terjadwal. Integrasi dengan dashboard keuangan.",
    span: "md:col-span-2",
  },
];

export const SAAS_HOW_IT_WORKS: SaasStep[] = [
  {
    num: "01",
    title: "Daftar Bisnis",
    desc: "Buat akun, isi nama bisnis & jenis usaha. Gratis, tanpa kartu kredit.",
  },
  {
    num: "02",
    title: "Setup Outlet",
    desc: "Tambahkan layanan, harga, dan staff. Import data pelanggan lama.",
  },
  {
    num: "03",
    title: "Mulai Transaksi",
    desc: "Buat order, terima pembayaran, print struk, lihat dashboard real-time.",
  },
];

// ponytail: these mirror lib/billing.ts (PRICE_PER_OUTLET=49000, ORIGINAL=79000, PRO=79000)
// so the landing page can't drift from the real billing UI. If those constants change,
// update here too.
export const SAAS_PRICING: SaasPricingPlan[] = [
  {
    name: "Free",
    price: "Rp 0",
    period: "/bulan",
    desc: "Untuk bisnis yang baru mulai",
    features: [
      "1 Outlet",
      "2 Staff",
      "100 Order/bulan",
      "Modul Laundry",
      "Dashboard dasar",
      "WhatsApp Order Button",
    ],
    cta: "Mulai Gratis",
    highlight: false,
  },
  {
    name: "Growth",
    price: "Rp 49K",
    originalPrice: "Rp 79K",
    discount: "HEMAT 38%",
    period: "/outlet/bulan",
    desc: "Untuk bisnis yang sedang tumbuh",
    features: [
      "Tambah Outlet Kapan Saja",
      "Unlimited Staff",
      "Unlimited Order",
      "Semua Modul",
      "Dashboard real-time",
      "Custom branding",
      "Thermal printer",
      "Priority support",
    ],
    cta: "Coba Growth 14 Hari Gratis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 79K",
    period: "/outlet/bulan",
    desc: "Untuk laundry yang ingin tumbuh dengan kehadiran online",
    features: [
      "Semua fitur Growth",
      "Website laundry sendiri (slug.hivepos.id)",
      "SEO lokal (Google Maps, schema.org)",
      "Template profesional",
      "Tombol WhatsApp order",
      "Track pesanan online untuk pelanggan",
    ],
    cta: "Coba Pro 14 Hari Gratis",
    highlight: true,
  },
];

export const SAAS_FAQS: SaasFaq[] = [
  {
    q: "Apakah hivePOS dipakai sendiri?",
    a: "Ya. hivePOS aktif dipakai di Honey Bee Laundry (laundry kami sendiri) sejak Juni 2026. Bisnis laundry-nya sendiri sudah berjalan sejak Oktober 2024. Setiap fitur diuji di operasional nyata sebelum dirilis ke pengguna lain.",
  },
  {
    q: "Apakah hivePOS benar-benar gratis?",
    a: "Ya. Paket Free tersedia permanen untuk 1 outlet, 2 staff, dengan 100 order per bulan — cukup untuk laundry baru dengan 3-4 order/hari. Butuh lebih? Upgrade ke Growth kapan saja, coba gratis 14 hari tanpa kartu kredit.",
  },
  {
    q: "Bisnis apa saja yang cocok dengan hivePOS?",
    a: "Saat ini fokus penuh untuk bisnis laundry (kiloan, satuan, express, sepatu, bedcover). Modul lain menyusul.",
  },
  {
    q: "Apakah saya butuh internet 24/7?",
    a: "Tidak. hivePOS tetap bisa beroperasi dengan koneksi minimal. Data tersinkron otomatis saat koneksi pulih.",
  },
  {
    q: "Bisakah saya pindah dari aplikasi kasir lain?",
    a: "Ya. Kami menyediakan migrasi data gratis dari sistem lama Anda.",
  },
  {
    q: "Apakah hivePOS mendukung printer thermal?",
    a: "Ya. Mendukung printer thermal 58mm dan 80mm. Print struk langsung dari browser via jaringan, Bluetooth, atau USB.",
  },
  {
    q: "Bagaimana keamanan data saya?",
    a: "Semua data terenkripsi, password di-hash, session berbasis JWT, setiap tenant terisolasi.",
  },
];

export const SAAS_NAV_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#modul", label: "Modul" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
] as const;

export const SAAS_TRUST_BADGES = [
  "Gratis 1 Outlet Selamanya",
  "Rp 49K/outlet",
  "Setup 2 menit",
] as const;

// ── Website (Pro) features ──
// ponytail: single source of truth for what "Website laundry sendiri" buys.
// Surfaced on landing spotlight + billing upsell so copy can't drift.
// customDomain reserved for Enterprise — add when that tier ships.
export const WEBSITE_FEATURES: WebsiteFeature[] = [
  // Branding & Subdomain
  { group: "Branding & Subdomain", icon: Globe,
    title: "Subdomain sendiri",
    desc: "URL profesional slug.hivepos.id untuk setiap outlet." },
  { group: "Branding & Subdomain", icon: Palette,
    title: "Template profesional",
    desc: "Layout editorial yang clean, mobile-first, siap pakai." },
  { group: "Branding & Subdomain", icon: ImageIcon,
    title: "Branding kustom",
    desc: "Tagline, hero photo, about text, logo, warna brand." },

  // SEO Lokal
  { group: "SEO Lokal", icon: Search,
    title: "Schema.org LocalBusiness",
    desc: "Google membaca jam buka, alamat, rating, harga — langsung." },
  { group: "SEO Lokal", icon: MapPin,
    title: "Google Maps integration",
    desc: "Peta interaktif + schema latitude/longitude untuk local search." },
  { group: "SEO Lokal", icon: HelpCircle,
    title: "FAQ markup",
    desc: "Schema FAQPage biar halaman sering muncul di featured snippet." },

  // Tracking & Pembayaran
  { group: "Tracking & Pembayaran", icon: Package,
    title: "Tracking pesanan online",
    desc: "Pelanggan cek status pesanan via nomor order — self-service." },
  { group: "Tracking & Pembayaran", icon: MessageCircle,
    title: "Tombol WhatsApp order",
    desc: "Deep link ke WhatsApp dengan template pesanan otomatis." },
  { group: "Tracking & Pembayaran", icon: QrCode,
    title: "QRIS display",
    desc: "Tampilkan QRIS di website untuk pembayaran instan." },

  // Kepercayaan & Konten
  { group: "Kepercayaan & Konten", icon: Star,
    title: "Trust signals",
    desc: "Google rating, tahun berdiri, waktu proses, area layanan." },
  { group: "Kepercayaan & Konten", icon: Quote,
    title: "Testimoni pelanggan",
    desc: "Review rich results untuk bintang di Google SERP." },
  { group: "Kepercayaan & Konten", icon: Clock,
    title: "Jam operasional",
    desc: "Indikator 'Buka Sekarang' + schema openingHours." },
  { group: "Kepercayaan & Konten", icon: Instagram,
    title: "Sosial media link",
    desc: "Instagram + WhatsApp link di header dan footer." },
  { group: "Kepercayaan & Konten", icon: Truck,
    title: "Form pickup",
    desc: "Pelanggan booking antar-jemput langsung dari website." },
];

export const WEBSITE_FEATURE_GROUPS: { name: WebsiteFeatureGroup; icon: LucideIcon }[] = [
  { name: "Branding & Subdomain", icon: Globe },
  { name: "SEO Lokal", icon: Search },
  { name: "Tracking & Pembayaran", icon: Package },
  { name: "Kepercayaan & Konten", icon: Star },
];
