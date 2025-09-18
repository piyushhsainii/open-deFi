"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { type Token, formatToken } from "@/lib/format";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { LendingApp } from "../../../../target/types/lending_app";
import { BN, Program } from "@coral-xyz/anchor";
import IDL from "../../../../programs/lending-app/src/build/lending_app.json";
import { toast } from "sonner";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { token_address } from "@/lib/data";
export default function DepositTab({
  token,
  setToken,
  value,
  setValue,
  refetch,
  connection,
}: {
  token: Token;
  setToken: Dispatch<SetStateAction<Token>>;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  refetch: any;
  connection: Connection;
}) {
  const wallet = useWallet();
  const [balance, setbalance] = useState(0);

  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const onDeposit = async (connection: Connection) => {
    setState("loading");
    setError(undefined);
    setHash(undefined);
    const decimals = 9;
    const transferAmount = Math.floor(Number(value) * 10 ** decimals);
    const amt = transferAmount;
    if (amt <= 0) {
      setState("error");
      setError("Enter a valid amount");
      return;
    }
    if (Number(value) > balance) {
      setState("error");
      setError("Insufficient balance");
      return;
    }
    if (
      !wallet.publicKey ||
      !wallet.connected ||
      !wallet ||
      !wallet.signTransaction
    ) {
      toast("Wallet not connected!");
      return;
    }
    try {
      console.log(`Initializing the Deposit Instruction`);
      const program: Program<LendingApp> = new Program(IDL, {
        connection: connection,
      });

      try {
        const tokenMint =
          token == "USDC" ? token_address.usdc : token_address.sol;
        const [bankTokenAccount, bump] = PublicKey.findProgramAddressSync(
          [Buffer.from("treasure"), new PublicKey(tokenMint).toBuffer()],
          program.programId
        );
        const [bankAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("bank"), new PublicKey(tokenMint).toBuffer()],
          program.programId
        );
        const userTokenATA = await getAssociatedTokenAddress(
          token == "USDC"
            ? new PublicKey(token_address.usdc)
            : new PublicKey(token_address.sol),
          wallet.publicKey,
          false,
          new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
        );
        console.log(userTokenATA.toString(), "user ata");
        // Deriving the token bank account
        const [userAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), new PublicKey(wallet.publicKey).toBuffer()],
          program.programId
        );
        console.log(transferAmount);
        const txInstruction = await program.methods
          .deposit(new BN(Number(transferAmount)))
          .accountsStrict({
            signer: wallet.publicKey,
            tokenMintAddress:
              token == "USDC" ? token_address.usdc : token_address.sol,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            bank: bankAccount,
            tokenBankAcc: bankTokenAccount,
            userLendingProgramAcc: userAccount,
            userTokenAccount: userTokenATA,
          })
          .instruction();

        const recentBlockHash = await connection.getLatestBlockhash({
          commitment: "confirmed",
        });
        const transaction = new Transaction({
          feePayer: wallet.publicKey,
          blockhash: recentBlockHash.blockhash,
          lastValidBlockHeight: recentBlockHash.lastValidBlockHeight,
        }).add(txInstruction);
        const msg = await connection.simulateTransaction(transaction);
        console.log(msg);
        const signedTx = await wallet.sendTransaction(transaction, connection);
        console.log(signedTx, "Tranasaction Hash");

        const confirmationTxt = await connection.confirmTransaction(
          signedTx,
          "confirmed"
        );
        await refetch();
        setState("success");
        setValue("");
        console.log(confirmationTxt, "Transaction Confirmed");
      } catch (e: any) {
        setState("error");
        setError(e?.message || "Network error");
      }
    } catch {
      console.log("came in catch");
    } finally {
      setTimeout(() => {
        setState("idle");
      }, 2700);
    }
  };
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

  useEffect(() => {
    setValue("0");
  }, [token]);

  useEffect(() => {
    getMaxBalance();
  }, [wallet.connected, token]);

  return (
    <Card className="border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Deposit</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <TokenSelector
              token={token}
              onChange={setToken}
              disabled={!wallet.connected}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info color="gray" />
                </TooltipTrigger>
                <TooltipContent>
                  These are <b>mock tokens</b> for testing only. They exist on
                  the <b>Solana Devnet</b> and hold{" "}
                  <b>no real monetary value</b>.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <AmountInput
            maxAmount={balance}
            token={token}
            value={value}
            onChange={setValue}
            onMax={() => setValue(String(balance))}
            disabled={!wallet.connected}
          />
          <FieldHelp>
            Available:{" "}
            <span className="font-mono">{formatToken(balance, token)}</span> •
            APY:{" "}
            <span className="font-mono">
              {/* {token === "USDC"
                ? data?.rates.usdc.depositAPY
                : data?.rates.sol.depositAPY} */}
              %
            </span>{" "}
            • Est. fee: <span className="font-mono">~0.0001 SOL</span>
          </FieldHelp>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => onDeposit(connection)}
              disabled={!wallet.connected || state === "loading"}
              className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
              variant="outline"
            >
              {state === "loading" ? "Depositing…" : "Deposit"}
            </Button>
            <Feedback state={state} hash={hash} message={error} />
          </div>
          {!wallet.connected ? (
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
