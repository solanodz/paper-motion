import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { KitNavLink } from "@/components/kit-nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const geistSerif = localFont({ src: "../fonts/GeistSerif-Regular.woff2", variable: "--font-geist-serif" });
const geistPixel = localFont({ src: "../fonts/GeistPixel-Square.woff2", variable: "--font-geist-pixel" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PAPER_MOTION_SITE ?? "https://paper-motion.vercel.app"),
  openGraph: { images: ["/site/og.png"], siteName: "paper-motion" },
  twitter: { card: "summary_large_image" },
  title: { default: "paper-motion · motion resources for AI agents", template: "%s · paper-motion" },
  description:
    "Transitions, component transitions, text effects, backgrounds, palettes, font pairs and video recipes your AI agent can pick by name and turn into a video.",
};

const NAV = [
  { href: "/library", label: "Library" },
  { href: "/docs", label: "For agents" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${geistSerif.variable} ${geistPixel.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 md:px-8">
            <Link href="/" className="whitespace-nowrap font-serif text-[22px] tracking-[-0.02em]">
              paper-motion
            </Link>
            <nav className="flex items-center gap-3 whitespace-nowrap font-mono text-[12px] text-muted sm:gap-5 sm:text-[13px]">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="transition-colors hover:text-figure">
                  {n.label}
                </Link>
              ))}
              <KitNavLink />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-8 font-mono text-[12px] text-muted md:flex-row md:items-center md:justify-between md:px-8">
            <span>paper-motion · creative-directed videos for people who use coding agents</span>
            <span>MIT · resources are yours to edit</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
