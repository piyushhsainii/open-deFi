"use client"

import { FadeIn } from "@/components/ui/fade-in"

const steps = [
  { title: "Connect Wallet", desc: "Use a Solana-compatible wallet to get started." },
  { title: "Deposit Collateral", desc: "Supply supported assets to earn and unlock borrowing power." },
  { title: "Borrow Assets", desc: "Access liquidity trustlessly with real-time health monitoring." },
  { title: "Earn Yield", desc: "Accrue interest on supplied assets and optimize returns." },
]

export function HowItWorksSection() {
  return (
    <section id="how" className="border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <FadeIn className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">How it works</h2>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            A streamlined, trustless flow that makes decentralized lending accessible—without compromising security.
          </p>
        </FadeIn>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <FadeIn key={s.title} delay={i * 80}>
              <li className="rounded-lg border border-gray-200 bg-white p-5 transition-transform duration-200 hover:scale-[1.02]">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{s.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">{s.desc}</p>
                  </div>
                </div>
              </li>
            </FadeIn>
          ))}
        </ol>
      </div>
    </section>
  )
}
