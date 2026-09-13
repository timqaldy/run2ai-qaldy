import type { Metadata, Viewport } from "next";
import { Manrope, Montserrat } from "next/font/google";
import { siteUrl } from "@/lib/format";
import "./globals.css";

const body = Manrope({ variable: "--font-body", subsets: ["latin", "cyrillic"], display: "swap" });
const heading = Montserrat({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const title = "Пробежка по ИИ-шкам — Beginner. Вайбкодинг с нуля";
const description =
  "Тренировка по вайбкодингу: берём идею и превращаем её в работающий цифровой продукт вместе с AI. 10 мест.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ru_KZ",
    images: [{ url: "/og-poster.jpg", width: 900, height: 1600 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#020814", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${body.variable} ${heading.variable} antialiased`}>
      <body className="min-h-dvh font-sans text-white">{children}</body>
    </html>
  );
}
