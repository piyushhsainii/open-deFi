"use client"

import { Github, BookText, Twitter } from "lucide-react"

export function FooterSection() {
  return (
    <footer id="docs" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <div className="font-semibold">SolendX</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              A minimal, professional protocol for decentralized lending on Solana.
            </p>
          </div>

          <nav aria-label="Footer" className="space-y-2">
            <div className="font-medium">Resources</div>
            <ul className="space-y-1 text-sm">
              <li>
                <a className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity" href="#">
                  <BookText className="h-4 w-4" aria-hidden="true" /> Documentation
                </a>
              </li>
              <li>
                <a className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity" href="#">
                  <Github className="h-4 w-4" aria-hidden="true" /> GitHub
                </a>
              </li>
              <li>
                <a className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity" href="#">
                  <Twitter className="h-4 w-4" aria-hidden="true" /> X (Twitter)
                </a>
              </li>
            </ul>
          </nav>

          <div className="space-y-2">
            <div className="font-medium">Disclaimer</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              DeFi involves market, smart contract, and liquidation risks. Always do your own research and only use
              funds you can afford to lose.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-600">
          © {new Date().getFullYear()} SolendX. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
