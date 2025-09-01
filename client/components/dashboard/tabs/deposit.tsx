"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLendingData } from "@/hooks/use-lending";
import { type Token, formatToken, parseAmount } from "@/lib/format";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { LendingApp } from "../../../../programs/lending-app/src/build/lending_app";
import { BN, Program } from "@coral-xyz/anchor";
import IDL from "../../../../programs/lending-app/src/build/lending_app.json";
export default function DepositTab() {
  const { publicKey, connected } = useWallet();
  const { data, deposit } = useLendingData();
  const [token, setToken] = useState<Token>("USDC");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const balance =
    token === "USDC" ? data?.balances.usdc ?? 0 : data?.balances.sol ?? 0;

  const onDeposit = async () => {
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
      const { tx } = await deposit(token, amt);
      setState("success");
      setHash(tx);
      setValue("");

      const connection = new Connection(clusterApiUrl("devnet"), {
        commitment: "confirmed",
      });

      const program: Program<LendingApp> = new Program(IDL, {
        connection: connection,
      });
      program.methods.deposit(new BN(2000)).accounts({
        signer: new PublicKey(publicKey?.toString()),
      });
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  useEffect(() => {}, [connected]);

  return (
    <Card className="border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Deposit</CardTitle>
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
            onMax={() => setValue(String(balance))}
            disabled={!connected}
          />
          <FieldHelp>
            Available:{" "}
            <span className="font-mono">{formatToken(balance, token)}</span> •
            APY:{" "}
            <span className="font-mono">
              {token === "USDC"
                ? data?.rates.usdc.depositAPY
                : data?.rates.sol.depositAPY}
              %
            </span>{" "}
            • Est. fee: <span className="font-mono">~0.0001 SOL</span>
          </FieldHelp>
          <div className="flex items-center gap-3">
            <Button
              onClick={onDeposit}
              disabled={!connected || state === "loading"}
              className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
              variant="outline"
            >
              {state === "loading" ? "Depositing…" : "Deposit"}
            </Button>
            <Feedback state={state} hash={hash} message={error} />
          </div>
          {!connected ? (
            <div
              className="inline-flex items-center gap-2 text-sm"
              style={{ color: "#666666" }}
            >
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-black"
                aria-hidden
              />
              Connect your wallet to continue
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
              You will deposit <span className="font-mono">{value || "0"}</span>{" "}
              {token}.
            </li>
            <li>Your funds begin earning interest instantly.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
