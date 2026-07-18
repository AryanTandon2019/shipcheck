import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ShipCheck — Production readiness for AI-built software",
    template: "%s · ShipCheck",
  },
  description:
    "ShipCheck audits public GitHub repositories for the production mistakes AI tools miss — secrets, auth gaps, rate limits, injection risks, and more.",
  openGraph: {
    title: "ShipCheck",
    description: "Production readiness audits for AI-built SaaS.",
    type: "website",
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
      className={`${inter.variable} ${display.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/*
        suppressHydrationWarning on body: password managers / ad blockers
        inject attributes (bis_register, __processed_*) before React hydrates.
        That is not an app bug — React's recommended fix is suppress on html/body.
      */}
      <body
        className="min-h-full flex flex-col surface-paper text-[var(--fg)]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
