"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { type Token, parseAmount } from "@/lib/format";
import {
  bankBalances,
  BankInfo,
  UserAccInfo,
} from "@/components/hooks/useDashboardData";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { LendingApp } from "../../../../programs/lending-app/src/build/lending_app";
import IDL from "../../../../programs/lending-app/src/build/lending_app.json";
import { BN, Program } from "@coral-xyz/anchor";
import { token_address } from "@/lib/data";
import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { toast } from "sonner";

export default function RepayTab({
  bankInfo,
  userAccountInfo,
  bankBalances,
  refetch,
  connection,
}: {
  bankInfo: BankInfo;
  userAccountInfo: UserAccInfo;
  bankBalances: bankBalances;
  refetch: () => Promise<void>;
  connection: Connection;
}) {
  const wallet = useWallet();
  const [token, setToken] = useState<Token>("USDC");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [balance, setbalance] = useState(0);

  const currentDebt =
    token == "USDC"
      ? userAccountInfo?.borrowedUsdc
      : userAccountInfo?.borrowedSol;

  const onRepay = async () => {
    setState("loading");
    setError(undefined);
    setHash(undefined);
    if (!wallet.publicKey) {
      toast("Wallet not connected");
      return;
    }
    const amt = Number(value);
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
      const decimalConversion = amt * 1000000000;
      const program: Program<LendingApp> = new Program(IDL, { connection });
      const ix = await program.methods
        .repay(new BN(decimalConversion))
        .accounts({
          repayMint: token == "USDC" ? token_address.usdc : token_address.sol,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          signer: wallet.publicKey,
        })
        .instruction();

      const bx = await connection.getLatestBlockhash();

      const tx = new Transaction({
        feePayer: wallet.publicKey,
        blockhash: bx.blockhash,
        lastValidBlockHeight: bx.lastValidBlockHeight,
      }).add(ix);

      const txSig = await wallet.sendTransaction(tx, connection);
      console.log(txSig);

      await connection.confirmTransaction(txSig, "confirmed");

      setState("success");
      setHash("");
      setValue("");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  useEffect(() => {
    const getMaxBalance = async () => {
      if (!wallet || !wallet.publicKey) return;

      const userTokenATA = await getAssociatedTokenAddress(
        token == "USDC"
          ? new PublicKey(token_address.usdc)
          : new PublicKey(token_address.sol),
        wallet.publicKey,
        false,
        new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
      );
      const balanceInfo = await connection.getTokenAccountBalance(userTokenATA);
      const uiAmount = balanceInfo.value.uiAmount || 0;
      setbalance(uiAmount);
    };
    getMaxBalance();
  }, []);

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
              {token}: {currentDebt}
            </span>
          </div>
          <TokenSelector
            token={token}
            onChange={setToken}
            disabled={!wallet.connected}
          />
          <AmountInput
            token={token}
            maxAmount={0}
            value={value}
            onChange={setValue}
            onMax={() => setValue(String(currentDebt))}
            maxLabel="Repay All"
            disabled={!wallet.connected}
          />
          <FieldHelp>
            Interest accrued: <span className="font-mono">~$0.03</span> • New
            health factor improves with repayment.
          </FieldHelp>
          <div className="flex items-center gap-3">
            <Button
              onClick={onRepay}
              disabled={!wallet.connected || state === "loading"}
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
