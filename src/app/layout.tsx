import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { AppProviders } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Plotty",
  description: "Каталог историй Plotty с чтением, авторскими сценариями и AI-инструментами.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
