"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useState } from "react";
import { useLendingData } from "@/hooks/use-lending";
import { type Token, parseAmount, formatToken } from "@/lib/format";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WithdrawTab() {
  const { connected } = useWallet();
  const { data, withdraw } = useLendingData();
  const [token, setToken] = useState<Token>("USDC");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const deposited =
    token === "USDC" ? data?.deposits.usdc ?? 0 : data?.deposits.sol ?? 0;
  const maxWithdrawable = Math.max(0, deposited - (data?.safetyBuffer ?? 0));

  const onWithdraw = async () => {
    setState("loading");
    setError(undefined);
    setHash(undefined);
    const amt = parseAmount(value, token);
    if (amt <= 0) {
      setState("error");
      setError("Enter a valid amount");
      return;
    }
    if (amt > maxWithdrawable) {
      setState("error");
      setError("Cannot withdraw - would trigger liquidation");
      return;
    }
    try {
      const { tx } = await withdraw(token, amt);
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
        <CardTitle className="text-base">Withdraw</CardTitle>
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
            onMax={() => setValue(String(maxWithdrawable))}
            disabled={!connected}
          />
          <FieldHelp>
            Deposited:{" "}
            <span className="font-mono">{formatToken(deposited, token)}</span> •
            Max withdrawable:{" "}
            <span className="font-mono">
              {formatToken(maxWithdrawable, token)}
            </span>
          </FieldHelp>
          <div className="flex items-center gap-3">
            <Button
              onClick={onWithdraw}
              disabled={!connected || state === "loading"}
              className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
              variant="outline"
            >
              {state === "loading" ? "Withdrawing…" : "Withdraw"}
            </Button>
            <Feedback state={state} hash={hash} message={error} />
          </div>
          {state === "error" && error?.includes("trigger liquidation") ? (
            <div className="inline-flex items-center gap-2 text-sm">
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-black"
                aria-hidden
              />
              Withdrawal exceeds safe limit.
            </div>
          ) : null}
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
              You will withdraw{" "}
              <span className="font-mono">{value || "0"}</span> {token}.
            </li>
            <li>Health factor may decrease if withdrawing collateral.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
