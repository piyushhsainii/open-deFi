"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector, AmountInput, FieldHelp, Feedback } from "./common";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { type Token, formatToken, parseAmount } from "@/lib/format";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { LendingApp } from "../../../../programs/lending-app/src/build/lending_app";
import { BN, Program } from "@coral-xyz/anchor";
import IDL from "../../../../programs/lending-app/src/build/lending_app.json";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { toast } from "sonner";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export default function DepositTab() {
  const wallet = useWallet();
  const [balance, setbalance] = useState(0);
  const [token, setToken] = useState<Token>("USDC");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const token_address = {
    usdc: "9SFMpR2owdeZpGRLomHsDtx5rEf2bVuo3XCgSjyAVUf4",
    sol: "J8NDF3RxtfZ5E2vks2NdchwE3PXNMNwUngCpEbMoLaoL",
  };

  const connection = new Connection(clusterApiUrl("devnet"), {
    commitment: "confirmed",
  });

  const onDeposit = async (connection: Connection) => {
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
      setState("success");
      setValue("");

      const program: Program<LendingApp> = new Program(IDL, {
        connection: connection,
      });
      // creating a transacation
      const txInstruction = await program.methods
        .deposit(new BN(2000))
        .accounts({
          signer: wallet.publicKey,
          tokenMintAddress:
            token == "USDC" ? token_address.usdc : token_address.sol,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();
      const recentBlockHash = await connection.getLatestBlockhash({
        commitment: "confirmed",
      });
      const transaction = new Transaction({
        feePayer: wallet.publicKey,
        blockhash: recentBlockHash.blockhash,
        lastValidBlockHeight: recentBlockHash.lastValidBlockHeight,
      }).add(txInstruction);

      const signedTx = await wallet.signTransaction(transaction);
      const txHash = await connection.sendRawTransaction(signedTx.serialize());
      console.log(txHash, "Tranasaction Hash");

      const confirmationTxt = await connection.confirmTransaction(
        txHash,
        "confirmed"
      );
      console.log(confirmationTxt, "Transaction Confirmed");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  const getMaxBalance = async () => {
    if (!wallet || !wallet.publicKey) return;

    if (token == "SOL") {
      const balance = await connection.getBalance(wallet.publicKey);
      setbalance(balance);
    } else {
      const getUsdcATA = await getAssociatedTokenAddress(
        new PublicKey(token_address.usdc),
        wallet.publicKey
      );
      const balance = await connection.getBalance(wallet.publicKey);
      setbalance(balance);
    }
  };

  useEffect(() => {
    getMaxBalance();
  }, [wallet.connected]);

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
