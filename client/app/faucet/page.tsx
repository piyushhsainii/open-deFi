"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import {
  addClaimRecord,
  FaucetRateStatus,
  getHistory,
  getRateStatus,
} from "@/components/faucet/rate-limit";
import { TOKENS } from "@/components/faucet/tokens";
import { FaucetTokenCard } from "@/components/faucet/faucet-token-card";
import { FaucetAmounts } from "@/components/faucet/faucet-amounts";

export default function FaucetPage() {
  const { toast } = useToast();
  const { address, connected, isConnecting } = useWallet();
  const [selectedMint, setSelectedMint] = useState<string>(TOKENS[0].mint);
  const [rate, setRate] = useState<FaucetRateStatus | null>(null);
  const [history, setHistory] = useState<
    Array<{ mint: string; amount: number; ts: number; sig?: string }>
  >([]);

  const selectedToken = useMemo(
    () => TOKENS.find((t) => t.mint === selectedMint)!,
    [selectedMint]
  );

  // refresh rate + history when wallet changes
  useEffect(() => {
    if (!address) return;
    setRate(getRateStatus(address));
    setHistory(getHistory(address));
  }, [address]);

  const refresh = () => {
    if (!address) return;
    setRate(getRateStatus(address));
    setHistory(getHistory(address));
  };

  const handleMint = async (amount: number) => {
    if (!address) {
      toast({
        title: "Connect wallet",
        description: "Please connect your devnet wallet to claim tokens.",
        variant: "default",
      });
      return;
    }
    const status = getRateStatus(address);
    if (!status.canClaim || amount > status.remaining) {
      toast({
        title: "Rate limit reached",
        description: `You can claim ${status.remaining} more token(s) this hour.`,
        variant: "default",
      });
      return;
    }

    try {
      const sig = `sim-${Date.now()}`;
      addClaimRecord(address, {
        mint: selectedMint,
        amount,
        ts: Date.now(),
        sig,
      });
      toast({
        title: "Airdrop requested",
        description: `Minted ${amount} ${selectedToken.symbol} to your wallet.`,
        variant: "default",
      });
      refresh();
      const el = document.getElementById("faucet-celebrate");
      if (el) {
        el.classList.remove("opacity-0");
        el.classList.add("animate-[pop_600ms_ease-out]");
        setTimeout(() => el.classList.add("opacity-0"), 800);
      }
    } catch (e: any) {
      toast({
        title: "Airdrop failed",
        description: e?.message || "Something went wrong.",
        variant: "default",
      });
    }
  };

  const remainingMins = useMemo(() => {
    if (!rate) return 0;
    const ms = Math.max(0, rate.resetTime - Date.now());
    return Math.ceil(ms / 60000);
  }, [rate]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 font-sans text-black">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-pretty text-2xl font-semibold">
          Devnet Token Faucet
        </h1>
        <Link href="/" className="text-sm underline">
          Back to app
        </Link>
      </header>

      {/* Educational banner */}
      <Card className="mb-8 p-5">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Welcome to our testing environment! This faucet provides free custom
            tokens so you can explore and test our DeFi lending protocol without
            any risk.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>Our lending protocol uses custom tokens for demonstration</li>
            <li>You need these tokens to deposit, borrow, and trade</li>
            <li>All transactions are on Solana devnet (no real value)</li>
            <li>Perfect for learning DeFi concepts safely</li>
          </ul>
          <ol className="list-decimal pl-5 text-sm text-gray-600">
            <li>Connect your devnet wallet</li>
            <li>Choose your desired token amount</li>
            <li>Airdrop tokens to your wallet</li>
            <li>Start exploring our lending features!</li>
          </ol>
        </div>
      </Card>

      {/* Wallet + Rate status */}
      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium">Wallet Status</h2>
          <p className="text-sm text-gray-600">
            Status:{" "}
            <span className="font-medium text-black">
              {isConnecting
                ? "Connecting"
                : connected
                ? "Connected"
                : "Disconnected"}
            </span>
          </p>
          <p className="break-all text-sm text-gray-600">
            Address:{" "}
            <span className="font-mono text-black">
              {address || "Not connected"}
            </span>
          </p>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium">Rate Limit</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Used</span>
            <span className="font-medium text-black">
              {rate?.claimed ?? 0} / 10 tokens
            </span>
          </div>
          <Progress
            value={((rate?.claimed ?? 0) / 10) * 100}
            className="mb-2 mt-1"
          />
          <p className="text-xs text-gray-600">
            {rate
              ? rate.canClaim
                ? `You can claim ${rate.remaining} more token(s) this hour.`
                : `You've reached your hourly limit.`
              : "Connect your wallet to see rate limits."}
            {rate && <span> Next reset in ~{remainingMins} minute(s).</span>}
          </p>
        </Card>
      </section>

      {/* Token cards */}
      <section className="mb-6 grid gap-4 md:grid-cols-2">
        {TOKENS.map((t) => (
          <FaucetTokenCard
            key={t.mint}
            token={t}
            selected={selectedMint === t.mint}
            onSelect={() => setSelectedMint(t.mint)}
          />
        ))}
      </section>

      {/* Amount presets */}
      <section className="mb-10">
        <Card className="p-4">
          <h2 className="mb-4 text-sm font-medium">Choose Amount</h2>
          <FaucetAmounts
            remaining={rate?.remaining ?? 0}
            disabled={!address || !(rate?.canClaim ?? false)}
            onPick={handleMint}
          />
        </Card>
      </section>

      {/* History */}
      <section className="mb-16">
        <h2 className="mb-2 text-sm font-medium">Recent Claims</h2>
        {history.length === 0 ? (
          <Card className="p-4 text-sm text-gray-600">No claims yet.</Card>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 8).map((h, i) => (
              <Card key={i} className="flex items-center justify-between p-3">
                <span className="text-sm text-gray-600">
                  {new Date(h.ts).toLocaleString()}
                </span>
                <span className="font-medium text-black">
                  +{h.amount} {TOKENS.find((t) => t.mint === h.mint)?.symbol}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Success pop animation */}
      <div
        id="faucet-celebrate"
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10 grid place-items-center opacity-0"
      >
        <div className="rounded-full border-4 border-black/20 p-8">
          <div className="h-8 w-8 rounded-full bg-blue-600" />
        </div>
      </div>
    </main>
  );
}
