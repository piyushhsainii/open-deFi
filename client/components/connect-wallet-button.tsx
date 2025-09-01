"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

export function ConnectWalletButton() {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)

  async function handleConnect() {
    if (connected || connecting) return
    setConnecting(true)
    await new Promise((r) => setTimeout(r, 1200))
    setConnecting(false)
    setConnected(true)
  }

  return (
    <button
      onClick={handleConnect}
      aria-label={connected ? "Wallet connected" : "Connect wallet"}
      className={[
        "inline-flex items-center justify-center rounded-md px-4 py-2",
        "bg-black text-white border border-black",
        "transition-transform duration-200 will-change-transform",
        "hover:scale-105 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
        connected ? "opacity-90 cursor-default" : "",
      ].join(" ")}
      disabled={connecting || connected}
    >
      {connecting ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Connecting…
        </span>
      ) : connected ? (
        "Connected"
      ) : (
        "Connect Wallet"
      )}
    </button>
  )
}
