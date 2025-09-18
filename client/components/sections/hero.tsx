"use client";

import { useCallback } from "react";
import type React from "react";
import { FadeIn } from "@/components/ui/fade-in";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function HeroSection() {
  const scrollToFeatures = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const el = document.getElementById("features");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  return (
    <section className="relative overflow-hidden border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-10 h-[50vh]">
        <FadeIn className="grid gap-10 md:grid-cols-2 md:gap-12 items-center h-full">
          <div className="space-y-9">
            <h1 className="text-3xl md:text-5xl font-semibold text-balance">
              Decentralized Lending on Solana
            </h1>
            <p className="text-gray-600 leading-relaxed text-pretty">
              Experience near-instant finality, low fees, and trustless
              borrowing. Deposit collateral, borrow assets, and earn
              yield—secured by code, powered by Solana.
            </p>
            <div className="flex items-center gap-3">
              <WalletMultiButton style={{ backgroundColor: "black" }} />
              <button
                onClick={scrollToFeatures}
                className={[
                  "inline-flex items-center justify-center rounded-md px-4 py-2",
                  "bg-white text-black border border-gray-200",
                  "hover:bg-black hover:text-white transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
                  "active:scale-[0.98] duration-200",
                ].join(" ")}
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="relative  h-full">
            <svg
              className="w-full h-64 md:h-80"
              viewBox="0 0 400 300"
              role="img"
              aria-label="Abstract monochrome geometric pattern"
            >
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="20" height="20" fill="white" />
                  <path d="M20 0 L0 0 0 20" stroke="black" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="400" height="300" fill="url(#grid)" />
              <g>
                <rect
                  x="40"
                  y="40"
                  width="120"
                  height="80"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                />
                <rect
                  x="220"
                  y="100"
                  width="140"
                  height="100"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                />
                <circle
                  cx="200"
                  cy="150"
                  r="50"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                />
              </g>
            </svg>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
