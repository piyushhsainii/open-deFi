"use client"

import { FadeIn } from "@/components/ui/fade-in"

const stats = [
  { label: "Total Value Locked (TVL)", value: "$128.4M" },
  { label: "Active Borrowers", value: "24,517" },
  { label: "Assets Supported", value: "32" },
  { label: "Liquidation Coverage", value: "110%" },
]

export function StatsSection() {
  return (
    <section id="stats" className="border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <FadeIn className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Protocol at a glance</h2>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Transparent, real-time metrics for a protocol designed to scale with Solana.
          </p>
        </FadeIn>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 70}>
              <div className="rounded-lg border border-gray-200 bg-white p-6 transition-transform duration-200 hover:scale-[1.02]">
                <div className="text-2xl font-semibold">{s.value}</div>
                <div className="text-sm text-gray-600 mt-1">{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
