import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LogoMark } from "@/components/logo";
import { ShaderPreview } from "@/components/shader-preview";
import { SITE } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const geistSerif = localFont({ src: "../fonts/GeistSerif-Regular.woff2", variable: "--font-geist-serif" });
const geistPixel = localFont({ src: "../fonts/GeistPixel-Square.woff2", variable: "--font-geist-pixel" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  openGraph: { images: ["/site/og.png"], siteName: "paper-motion" },
  twitter: { card: "summary_large_image" },
  title: { default: "paper-motion · videos your agent can make", template: "%s · paper-motion" },
  description:
    "A gallery of videos made by coding agents, each with the exact prompt that made it. Pick one, adapt it to your brand, paste it into your agent.",
};

// the sign-off: the wordmark in liquid metal, as wide as the page
const METAL = {
  shader: "LiquidMetal",
  image: "/site/lockup.svg",
  props: {
    fit: "contain",
    scale: 0.94,
    shape: "none",
    colorBack: "#000000",
    colorTint: "#ffffff",
    softness: 0.12,
    repetition: 5,
    shiftRed: 0.3,
    shiftBlue: 0.3,
    distortion: 0.14,
    contour: 0.6,
    angle: 20,
    speed: 1,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${geistSerif.variable} ${geistPixel.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-ground">
          <div className="flex h-[52px] items-stretch justify-between">
            <Link href="/" className="flex shrink-0 items-center gap-2 px-4 font-serif text-[19px] tracking-[-0.02em] sm:px-5 sm:text-[21px] md:px-8">
              <LogoMark size={18} className="sm:h-5 sm:w-5" />
              paper-motion
            </Link>
            <nav className="cells text-[13px] [&>*]:h-full max-sm:[&>*]:px-3">
              <Link href="/" className="cell">Gallery</Link>
              <Link href="/pedir" className="cell"><span className="sm:hidden">Pedir</span><span className="hidden sm:inline">Pedí tu video</span></Link>
              <a href="/llms.txt" className="cell hidden font-mono text-[12px] sm:flex">llms.txt</a>
              <a href="https://github.com/solanodz/paper-motion" className="cell">GitHub</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="grid gap-y-8 px-5 py-10 md:grid-cols-[1fr_auto] md:items-end md:px-8">
            <p className="max-w-[26ch] font-serif text-[30px] leading-[1.05] tracking-[-0.02em] md:text-[40px]">
              Every video here was made by an agent, from the prompt beside it.
            </p>
            <div className="cells flex-wrap border border-line text-[13px] [&>*:first-child]:border-l-0 [&>*]:h-10">
              <Link href="/" className="cell">Gallery</Link>
              <a href="/llms.txt" className="cell font-mono text-[12px]">llms.txt</a>
              <a href="https://github.com/solanodz/paper-motion" className="cell">GitHub</a>
              <span className="cell font-mono text-[12px]">MIT</span>
            </div>
          </div>
          <div role="img" aria-label="paper-motion" className="relative">
            <ShaderPreview entry={METAL} className="aspect-[5/1] min-h-[120px] w-full" />
            {/* the wordmark sinks into the bottom of the page: black rises over its lower half */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ground from-15% via-ground/80 via-40% to-transparent to-70%" />
          </div>
        </footer>
      </body>
    </html>
  );
}
