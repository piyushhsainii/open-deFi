"use client"

import { FadeIn } from "@/components/ui/fade-in"
import { Zap, ShieldCheck, Layers, Coins, AlarmClock, Unplug } from "lucide-react"

const features = [
  { title: "Fast Transactions", desc: "Sub-second finality with Solana’s high-throughput architecture.", icon: Zap },
  { title: "Low Fees", desc: "A fraction of a cent per transaction—optimize capital efficiency.", icon: Coins },
  {
    title: "Trustless & Permissionless",
    desc: "Non-custodial, transparent smart contracts. No intermediaries.",
    icon: ShieldCheck,
  },
  {
    title: "Cross-Collateral Lending",
    desc: "Diversify collateral types to unlock more flexible borrowing.",
    icon: Layers,
  },
  {
    title: "Automated Liquidations",
    desc: "On-chain, rules-based safeguards to protect the protocol.",
    icon: AlarmClock,
  },
  { title: "Composability", desc: "Integrates with the Solana ecosystem for expanding use cases.", icon: Unplug },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <FadeIn className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Why SolendX</h2>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Minimal, fast, and secure. Built for scale on Solana—optimized for speed, cost, and the trustless future of
            finance.
          </p>
        </FadeIn>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 60}>
              <div className="group rounded-lg border border-gray-200 bg-white p-5 transition-transform duration-200 hover:scale-[1.02]">
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-md border border-gray-200 p-2 bg-white text-black transition-colors group-hover:bg-black group-hover:text-white"
                    aria-hidden="true"
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
