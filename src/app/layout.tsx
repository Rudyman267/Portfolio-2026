import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, EB_Garamond } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Loader label ("cooking" / "click to enter") — Figma 124:80 uses EB Garamond
// Medium Italic. Italic-only, single weight, so the extra font cost is tiny.
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rudyman",
    template: "%s — Rudyman",
  },
  description: "AI-native Product Designer who ships code and design.",
  openGraph: {
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${geistMono.variable} ${ebGaramond.variable} h-full`}
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
