"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldHelp, Feedback } from "./common";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLendingData } from "@/hooks/use-lending";

export default function LiquidateTab() {
  const { connected } = useWallet();
  const { data, liquidate } = useLendingData();
  const [selected, setSelected] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const positions = data?.liquidatable ?? [];

  const onLiquidate = async () => {
    if (selected === null) return;
    setState("loading");
    setError(undefined);
    setHash(undefined);
    try {
      const { tx } = await liquidate(positions[selected]);
      setState("success");
      setHash(tx);
      setSelected(null);
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  return (
    <Card className="border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Liquidate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {positions.length === 0 ? (
          <div
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: "#666666" }}
          >
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-black"
              aria-hidden
            />
            No positions available for liquidation
          </div>
        ) : (
          <ul className="divide-y divide-black/10 rounded-md border border-black/10">
            {positions.map((p, i) => (
              <li
                key={i}
                className="flex cursor-pointer items-center justify-between p-3 transition hover:scale-[1.01]"
                style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
                onClick={() => setSelected(i)}
                aria-selected={selected === i}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {p.account.slice(0, 6)}…{p.account.slice(-4)}
                  </div>
                  <div className="text-xs" style={{ color: "#666666" }}>
                    Debt: ${p.debtUSD.toFixed(2)} • Collateral: $
                    {p.collateralUSD.toFixed(2)} • HF:{" "}
                    {p.healthFactor.toFixed(2)}
                  </div>
                  <div className="text-xs">
                    Bonus:{" "}
                    <span className="font-mono">
                      {(p.bonusPct * 100).toFixed(1)}%
                    </span>{" "}
                    • Est. Profit:{" "}
                    <span className="font-mono">
                      ${(p.debtUSD * p.bonusPct).toFixed(2)}
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  readOnly
                  checked={selected === i}
                  className="h-4 w-4 border-black accent-black"
                />
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={onLiquidate}
            disabled={
              !connected ||
              selected === null ||
              state === "loading" ||
              positions.length === 0
            }
            className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
            variant="outline"
          >
            {state === "loading" ? "Liquidating…" : "Liquidate"}
          </Button>
          <Feedback state={state} hash={hash} message={error} />
        </div>
        <FieldHelp>
          Liquidations repay debt and claim collateral with a protocol-defined
          bonus.
        </FieldHelp>
      </CardContent>
    </Card>
  );
}
