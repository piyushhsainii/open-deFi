import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { StatsSection } from "@/components/sections/stats";
import { FooterSection } from "@/components/sections/footer";
import Link from "next/link";

export default function Page() {
  return (
    <main className="font-sans bg-white text-black">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <a
            href="#"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="sr-only">Solana Lending Protocol</span>
            <span>SolendX</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:opacity-80 transition-opacity">
              Features
            </a>
            <a href="#how" className="hover:opacity-80 transition-opacity">
              How it works
            </a>
            <a href="#stats" className="hover:opacity-80 transition-opacity">
              Stats
            </a>
            <a href="#docs" className="hover:opacity-80 transition-opacity">
              Docs
            </a>
            <Link
              href="/dashboard"
              aria-label="Go to dashboard"
              className="inline-flex items-center rounded-md border border-gray-200 bg-black text-white px-3 py-1.5 font-medium transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-200"
            >
              Dashboard
            </Link>
          </nav>
          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="md:hidden inline-flex items-center rounded-md border border-gray-200 bg-black text-white px-3 py-1.5 text-sm font-medium transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-200"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <FooterSection />
    </main>
  );
}
