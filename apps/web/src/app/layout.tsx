import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { HeaderNav } from "@/components/header-nav";
import { ShaderPreview } from "@/components/shader-preview";
import { getResource } from "@/lib/registry";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  // the sign-off: the wordmark as liquid metal, one of the library's own backgrounds, as wide as the page
  const metal = getResource("liquid-metal")?.install.entry as { shader: string; props: Record<string, unknown>; image?: string } | undefined;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${geistSerif.variable} ${geistPixel.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-ground">
          <div className="flex h-[52px] items-stretch justify-between">
            <Link href="/" className="flex shrink-0 items-center px-4 font-serif text-[19px] tracking-[-0.02em] sm:px-5 sm:text-[21px] md:px-8">
              paper-motion
            </Link>
            {/* reads the pathname: on routes rendered per request it streams in after the shell */}
            <Suspense fallback={null}><HeaderNav /></Suspense>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="grid gap-y-8 px-5 py-10 md:grid-cols-[1fr_auto] md:items-end md:px-8">
            <p className="max-w-[26ch] font-serif text-[30px] leading-[1.05] tracking-[-0.02em] md:text-[40px]">Creative-directed videos for people who use coding agents.</p>
            <div className="cells flex-wrap border border-line text-[13px] [&>*:first-child]:border-l-0 [&>*]:h-10">
              <Link href="/library" className="cell">Library</Link>
              <Link href="/docs" className="cell">For agents</Link>
              <a href="/llms.txt" className="cell font-mono text-[12px]">llms.txt</a>
              <a href="https://github.com/solanodz/paper-motion" className="cell">GitHub</a>
              <span className="cell font-mono text-[12px]">MIT</span>
            </div>
          </div>
          {metal ? (
            <div role="img" aria-label="paper-motion" className="relative">
              <ShaderPreview entry={{ ...metal, props: { ...metal.props, scale: 0.94 } }} className="aspect-[5/1] min-h-[120px] w-full" />
              {/* the wordmark sinks into the bottom of the page: black rises over its lower half */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ground from-15% via-ground/80 via-40% to-transparent to-70%" />
            </div>
          ) : null}
        </footer>
      </body>
    </html>
  );
}
