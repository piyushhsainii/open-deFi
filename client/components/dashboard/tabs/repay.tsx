"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useState } from "react";
import { useLendingData } from "@/hooks/use-lending";
import { useWallet } from "@solana/wallet-adapter-react";
import { type Token, formatToken, parseAmount } from "@/lib/format";

export default function RepayTab() {
  const { connected } = useWallet();
  const { data, repay } = useLendingData();
  const [token, setToken] = useState<Token>("USDC");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const balance =
    token === "USDC" ? data?.balances.usdc ?? 0 : data?.balances.sol ?? 0;
  const currentDebt =
    token === "USDC" ? data?.debts.usdc ?? 0 : data?.debts.sol ?? 0;

  const onRepay = async () => {
    setState("loading");
    setError(undefined);
    setHash(undefined);
    const amt = parseAmount(value, token);
    if (amt <= 0) {
      setState("error");
      setError("Enter a valid amount");
      return;
    }
    if (amt > balance) {
      setState("error");
      setError("Insufficient balance");
      return;
    }
    try {
      const { tx } = await repay(token, Math.min(amt, currentDebt));
      setState("success");
      setHash(tx);
      setValue("");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  return (
    <Card className="border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Repay</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div
            className="rounded-md border border-black/10 p-3 text-sm"
            style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
          >
            Current debt:{" "}
            <span className="font-mono">
              {token}: {formatToken(currentDebt, token)}
            </span>
          </div>
          <TokenSelector
            token={token}
            onChange={setToken}
            disabled={!connected}
          />
          <AmountInput
            token={token}
            value={value}
            onChange={setValue}
            onMax={() => setValue(String(currentDebt))}
            maxLabel="Repay All"
            disabled={!connected}
          />
          <FieldHelp>
            Interest accrued: <span className="font-mono">~$0.03</span> • New
            health factor improves with repayment.
          </FieldHelp>
          <div className="flex items-center gap-3">
            <Button
              onClick={onRepay}
              disabled={!connected || state === "loading"}
              className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
              variant="outline"
            >
              {state === "loading" ? "Repaying…" : "Repay"}
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
              You will repay <span className="font-mono">{value || "0"}</span>{" "}
              {token}.
            </li>
            <li>Health factor will increase accordingly.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
