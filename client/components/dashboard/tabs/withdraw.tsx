"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useEffect, useState } from "react";
import { type Token, formatToken } from "@/lib/format";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  bankBalances,
  BankInfo,
  UserAccInfo,
} from "@/components/hooks/useDashboardData";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { LendingApp } from "../../../../programs/lending-app/src/build/lending_app";
import { BN, Program } from "@coral-xyz/anchor";
import IDL from "../../../../programs/lending-app/src/build/lending_app.json";
import { token_address } from "@/lib/data";
import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { toast } from "sonner";

export default function WithdrawTab({
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
  const [maxWithdrawable, setmaxWithdrawable] = useState(0);
  const [balance, setbalance] = useState(0);
  // Dialog states
  const [showLiquidationDialog, setShowLiquidationDialog] = useState(false);
  const [showRiskDialog, setShowRiskDialog] = useState(false);

  const onWithdraw = async () => {
    setState("loading");
    setError(undefined);
    setHash(undefined);
    if (!wallet.publicKey) {
      toast("Wallet not connected");
      return;
    }
    if (Number(value) <= 0) {
      setState("error");
      setError("Enter a valid amount");
      return;
    }
    const activeDeposit =
      token == "USDC"
        ? userAccountInfo.depositedUsdc
        : userAccountInfo.depositedSol;

    if (Number(value) > Number(activeDeposit)) {
      setState("error");
      setError("Cannot withdraw more amount than deposited");
      // return;
    }
    const mint = token == "USDC" ? token_address.usdc : token_address.sol;

    try {
      const program: Program<LendingApp> = new Program(IDL, { connection });
      const decimalAmount = Number(value) * 1000000000;
      const ix = await program.methods
        .withdraw(new BN(decimalAmount))
        .accounts({
          mint: mint,
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
      refetch();
      setState("success");
      setHash("");
      setValue("");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  const computeMaxWithDrawable = async () => {
    const activeDeposit =
      token == "USDC"
        ? Number(userAccountInfo?.depositedUsdc)
        : Number(userAccountInfo?.depositedSol);
    const activeBorrowed =
      token == "USDC"
        ? Number(userAccountInfo?.borrowedUsdc)
        : Number(userAccountInfo?.borrowedSol);
    const afterBalance = activeDeposit - Number(value);
    const MinAmountRequired = (activeDeposit * 80) / 100;

    // check for liquidation threshold
    const HealthFactor = Number(
      Number(MinAmountRequired / activeBorrowed).toFixed(2)
    );
    if (HealthFactor < 1) {
      // show warning to user that account cant be liquidated
      setShowLiquidationDialog(true);
    }
    if (HealthFactor > 1 && HealthFactor < 1.2) {
      // show warning that account is at risk
      setShowRiskDialog(true);
    }

    const maxSafeWithDrawal = activeDeposit - MinAmountRequired;
    setmaxWithdrawable(maxSafeWithDrawal);
    console.log(`Health Factor`, HealthFactor);
    console.log(`Min Amt Require-`, MinAmountRequired);
    console.log(`Max Safe Withdrawal`, maxSafeWithDrawal);
  };

  useEffect(() => {
    computeMaxWithDrawable();
  }, [value, token]);

  useEffect(() => {
    setValue("0");
  }, [token]);

  return (
    <>
      <Card className="border-black/10">
        <CardHeader>
          <CardTitle className="text-base">Withdraw</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <TokenSelector
              token={token}
              onChange={setToken}
              disabled={!wallet.connected}
            />
            <AmountInput
              maxAmount={
                token == "USDC"
                  ? Number(userAccountInfo?.depositedUsdc)
                  : Number(userAccountInfo?.depositedSol)
              }
              token={token}
              value={value}
              onChange={setValue}
              onMax={() => setValue(String(maxWithdrawable))}
              disabled={!wallet.connected}
            />
            <FieldHelp>
              {Number(value) > maxWithdrawable
                ? "This Withdrawal may put your account at risk of liquidation"
                : " Max Amount that you can withdrawa safely: "}
              <span className="font-mono px-1">
                {formatToken(maxWithdrawable, token)}
              </span>
            </FieldHelp>
            <div className="flex items-center gap-3">
              <Button
                onClick={onWithdraw}
                disabled={!wallet.connected || state === "loading"}
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

      {/* Liquidation Warning Dialog */}
      <AlertDialog
        open={showLiquidationDialog}
        onOpenChange={setShowLiquidationDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Account Liquidation Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Your account cannot be liquidated with this withdrawal amount. The
              health factor would drop below 1.0, which puts your account at
              immediate risk of liquidation. Please reduce the withdrawal amount
              to maintain a healthy position.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLiquidationDialog(false)}>
              Understood
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setValue(String(maxWithdrawable));
                setShowLiquidationDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Set Safe Amount
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Risk Warning Dialog */}
      <AlertDialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-yellow-600">
              Account At Risk Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Your account is at risk with this withdrawal amount. The health
              factor would be between 1.0 and 1.2, which puts your account close
              to liquidation risk. Consider withdrawing a smaller amount to
              maintain a safer position.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRiskDialog(false)}>
              Continue Anyway
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setValue(String(maxWithdrawable));
                setShowRiskDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Set Safe Amount
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
