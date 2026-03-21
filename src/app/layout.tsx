import type { Metadata } from "next";
import { Literata, Manrope } from "next/font/google";

import { AppProviders } from "./providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Plotty Catalog",
  description: "Plotty catalog shell with mock data and AI beta-reader teaser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${manrope.variable} ${literata.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

