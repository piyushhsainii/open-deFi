"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useState, useMemo, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { type Token, parseAmount } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import {
  bankBalances,
  BankInfo,
  UserAccInfo,
} from "@/components/hooks/useDashboardData";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { LendingApp } from "../../../../programs/lending-app/src/build/lending_app";
import IDL from "../../../../programs/lending-app/src/build/lending_app.json";
import { PYTH_SOL_PRICE, PYTH_USDC_PRICE, token_address } from "@/lib/data";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export default function BorrowTab({
  bankInfo,
  userAccountInfo,
  bankBalances,
  refetch,
  connection,
}: {
  bankInfo: BankInfo;
  userAccountInfo: UserAccInfo;
  bankBalances: bankBalances;
  refetch: any;
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

  const available = 0;
  const amt = Number(value);

  const ratio = useMemo(() => {
    const borrowed =
      Number(value) +
      (token == "USDC"
        ? Number(userAccountInfo?.borrowedUsdc)
        : Number(userAccountInfo?.borrowedSol));
    const deposited =
      token == "USDC"
        ? Number(userAccountInfo?.depositedUsdc)
        : Number(userAccountInfo?.depositedSol);
    const pct = Math.min(100, Math.max(0, (borrowed / deposited) * 100));
    console.log(`borrowed`, borrowed);
    console.log(`deposited`, deposited);
    return isFinite(pct) ? pct : 0;
  }, [amt, token, value]);

  useEffect(() => {
    setValue("0");
  }, [token]);

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
    try {
      const program: Program<LendingApp> = new Program(IDL, { connection });
      const mintAddress =
        token == "USDC" ? token_address.usdc : token_address.sol;
      // @ts-ignore
      const pyth = new PythSolanaReceiver({ connection, wallet: wallet });

      const FEED_ID = token == "USDC" ? PYTH_USDC_PRICE : PYTH_SOL_PRICE;
      const PriceFeedAccount = pyth
        .getPriceFeedAccountAddress(0, FEED_ID)
        .toBase58();
      console.log(value);

      const [bankPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bank"), new PublicKey(mintAddress).toBuffer()],
        program.programId
      );

      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), wallet.publicKey!.toBuffer()],
        program.programId
      );

      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasure"), new PublicKey(mintAddress).toBuffer()],
        program.programId
      );
      const DECIAMl_CONVERSION = Number(value) * 1000000000;
      console.log(DECIAMl_CONVERSION);
      const ix = await program.methods
        .borrow(new BN(DECIAMl_CONVERSION))
        .accountsPartial({
          mint: mintAddress,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          signer: wallet.publicKey!,
          priceUpdate: PriceFeedAccount,
          bank: bankPda,
          userAccount: userPda,
          tokenBankAcc: treasuryPda,
        })
        .instruction();
      const getBlockHx = await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction({
        feePayer: wallet.publicKey,
        blockhash: getBlockHx.blockhash,
        lastValidBlockHeight: getBlockHx.lastValidBlockHeight,
      }).add(ix);

      // const message = await connection.simulateTransaction(tx);
      // console.log(message);

      const txSig = await wallet.sendTransaction(tx, connection);
      console.log(txSig);
      await connection.confirmTransaction(txSig);
      setState("success");
      setHash("tx");
      setValue("");
      refetch();
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
            disabled={!wallet.connected}
          />
          <AmountInput
            token={token}
            value={value}
            maxAmount={
              token == "USDC"
                ? bankBalances.tokenA.availableToBorrow
                : bankBalances.tokenB.availableToBorrow
            }
            onChange={setValue}
            onMax={() => {
              setValue(
                token == "USDC"
                  ? bankBalances.tokenA.availableToBorrow
                  : bankBalances.tokenB.availableToBorrow
              );
            }}
            maxLabel="Max safe"
            disabled={!wallet.connected}
          />
          <FieldHelp>
            Available to borrow:{" "}
            <span className="font-mono">${available.toFixed(2)}</span> • Borrow
            APY: <span className="font-mono">%</span>
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
              disabled={!wallet.connected || state === "loading"}
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
