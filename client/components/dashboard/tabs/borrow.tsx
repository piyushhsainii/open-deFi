"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { type Token, parseAmount } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

export default function BorrowTab() {
  const { connected } = useWallet();
  const [token, setToken] = useState<Token>("USDC");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const available = 0;
  const amt = parseAmount(value, token);

  const ratio = useMemo(() => {
    const borrowed = 0 + toUSD(amt, token);
    const deposited = 1;
    const pct = Math.min(100, Math.max(0, (borrowed / deposited) * 100));
    return isFinite(pct) ? pct : 0;
  }, [amt, token]);

  const risk = ratio > 80 ? "High" : ratio > 60 ? "Elevated" : "Low";

  const onBorrow = async () => {
    setState("loading");
    setError(undefined);
    setHash(undefined);
    if (amt <= 0) {
      setState("error");
      setError("Enter a valid amount");
      return;
    }
    if (toUSD(amt, token) > available) {
      setState("error");
      setError("Insufficient collateral");
      return;
    }
    try {
      // const { tx } = await borrow(token, amt);
      setState("success");
      setHash("tx");
      setValue("");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  return (
    <Card className="border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Borrow</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <TokenSelector
            token={token}
            onChange={setToken}
            disabled={!connected}
          />
          <AmountInput
            token={token}
            value={value}
            onChange={setValue}
            onMax={() => setValue(String(fromUSD(available, token)))}
            maxLabel="Max safe"
            disabled={!connected}
          />
          <FieldHelp>
            Available to borrow:{" "}
            <span className="font-mono">${available.toFixed(2)}</span> • Borrow
            APY:{" "}
            <span className="font-mono">
              {/* {token === "USDC"
                ? data?.rates.usdc.borrowAPY
                : data?.rates.sol.borrowAPY} */}
              %
            </span>
          </FieldHelp>

          <div
            className="rounded-md border border-black/10 p-4"
            style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#666666" }}>
                Collateral ratio
              </span>
              <span className="font-mono text-sm">{ratio.toFixed(0)}%</span>
            </div>
            <Progress value={ratio} className="mt-2 h-2 transition-[width]" />
            <div className="mt-2 text-sm">
              Risk:{" "}
              <span className={risk === "High" ? "font-semibold" : ""}>
                {risk}{" "}
                {risk === "High" && (
                  <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-black" />
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onBorrow}
              disabled={!connected || state === "loading"}
              className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
              variant="outline"
            >
              {state === "loading" ? "Borrowing…" : "Borrow"}
            </Button>
            <Feedback state={state} hash={hash} message={error} />
          </div>
        </div>

        <div
          className="rounded-md border border-black/10 p-4"
          style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
        >
          <div className="text-sm" style={{ color: "#666666" }}>
            Preview
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              You will borrow <span className="font-mono">{value || "0"}</span>{" "}
              {token}.
            </li>
            <li>Health factor will decrease accordingly.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function toUSD(amount: number, token: Token) {
  const price = token === "USDC" ? 1 : 150; // mock SOL price
  return amount * price;
}
function fromUSD(usd: number, token: Token) {
  const price = token === "USDC" ? 1 : 150;
  return usd / price;
}
