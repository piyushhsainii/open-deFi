"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortfolioCards } from "@/components/dashboard/portfolio-cards";
import { AccountSummary } from "@/components/dashboard/account-summary";
import DepositTab from "@/components/dashboard/tabs/deposit";
import BorrowTab from "@/components/dashboard/tabs/borrow";
import RepayTab from "@/components/dashboard/tabs/repay";
import WithdrawTab from "@/components/dashboard/tabs/withdraw";
import LiquidateTab from "@/components/dashboard/tabs/liquidate";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Program } from "@coral-xyz/anchor";
import { LendingApp } from "../../../target/types/lending_app";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import IDL from "../../../programs/lending-app/src/build/lending_app.json";
import { SUPPORTED_TOKENS } from "../admin/page";

export default function DashboardPage() {
  const [error, seterror] = useState(null);
  const { connected, publicKey, connect, disconnect, connecting } = useWallet();
  const [UserAccountInfo, setUserAccountInfo] = useState({
    tokenA: {
      availableToBorrow: 0,
      healthFactor: 0,
      totalBorrowed: 0,
      totalDeposited: 0,
    },
    tokenB: {
      availableToBorrow: 0,
      healthFactor: 0,
      totalBorrowed: 0,
      totalDeposited: 0,
    },
  });
  const truncated = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : "Not connected";

  const getDashboardData = async () => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const program: Program<LendingApp> = new Program(IDL, {
        connection: connection,
      });
      const [user] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), publicKey?.toBuffer()!],
        program.programId
      );
      const getAccountATA = await program.account.user.fetch(user, "confirmed");
      // Load in Banks
      // Sol Bank
      const [solBankATA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bank"),
          new PublicKey(SUPPORTED_TOKENS[1].mint).toBuffer(),
        ],
        program.programId
      );
      // USDC Bank
      const [UsdcBankATA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bank"),
          new PublicKey(SUPPORTED_TOKENS[0].mint).toBuffer(),
        ],
        program.programId
      );

      const SolBankInfo = await program.account.bank.fetch(
        new PublicKey(solBankATA),
        "confirmed"
      );
      const USDCBankInfo = await program.account.bank.fetch(
        new PublicKey(UsdcBankATA),
        "confirmed"
      );

      const SolmaxLtv = Math.floor(SolBankInfo.maxLtv / 10000);
      const USDCmaxLtv = Math.floor(USDCBankInfo.maxLtv / 10000);

      const solAvailableToBorrow = Math.floor(
        getAccountATA.depositedSol.SolmaxLtv
      );
      const liquidationThreshold = Math.floor(
        SolBankInfo.liquidationThreshold / 10000
      );
      const SolhealthFactor = Math.floor(
        Math.floor(getAccountATA.depositedSol * liquidationThreshold) /
          getAccountATA.borrowedUsdc
      );

      const solBank = setUserAccountInfo({
        tokenA: {
          //SOL
          availableToBorrow: solAvailableToBorrow ?? 0,
          healthFactor: 0,
          totalBorrowed: getAccountATA.borrowedSol,
          totalDeposited: getAccountATA.depositedSol,
        },
        tokenB: {
          availableToBorrow: 0,
          healthFactor: 0,
          totalBorrowed: getAccountATA.borrowedUsdc,
          totalDeposited: getAccountATA.depositedUsdc,
        },
      });
    } catch (error) {
      setUserAccountInfo({
        tokenA: {
          //SOL
          availableToBorrow: 0,
          healthFactor: 0,
          totalBorrowed: 0,
          totalDeposited: 0,
        },
        tokenB: {
          //USDC
          availableToBorrow: 0,
          healthFactor: 0,
          totalBorrowed: 0,
          totalDeposited: 0,
        },
      });
      console.log(`Something went wrong -`, error);
    }
  };

  useEffect(() => {
    getDashboardData();
  }, [connected]);

  return (
    <main className="min-h-dvh bg-white text-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <Link href={"/"} className="flex items-center gap-1 cursor-pointer">
          {" "}
          <ArrowLeft size={18} /> Back to Home{" "}
        </Link>
        <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-pretty text-2xl font-semibold tracking-tight">
              Solana Lending Dashboard
            </h1>
            <p className="text-sm" style={{ color: "#666666" }}>
              Professional monochrome interface with smooth interactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Card className="">
              <CardContent className="flex items-center gap-2 px-3 py-2">
                <span
                  className="font-mono text-xs"
                  style={{ color: "#666666" }}
                >
                  {truncated}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    connected ? "bg-black" : ""
                  }`}
                  style={
                    !connected ? { backgroundColor: "#999999" } : undefined
                  }
                  aria-hidden
                />
              </CardContent>
            </Card>
            {connecting ? (
              <div> loading wallet... </div>
            ) : connected ? (
              <Button
                variant="outline"
                className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            ) : (
              <WalletMultiButton
                className="bg-black fill-black"
                style={{ backgroundColor: "black" }}
              />
            )}
          </div>
        </header>

        <section aria-label="Portfolio overview" className="mb-6">
          <PortfolioCards
            loading={false}
            data={{
              tokenA: {
                availableToBorrow: 0,
                healthFactor: 0,
                totalBorrowed: 0,
                totalDeposited: 0,
              },
              tokenB: {
                availableToBorrow: 0,
                healthFactor: 0,
                totalBorrowed: 0,
                totalDeposited: 0,
              },
            }}
          />
        </section>

        <section aria-label="Account summary" className="mb-8">
          <AccountSummary loading={false} />
        </section>

        <section aria-label="Actions" className="mb-16">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white">
              <TabsTrigger value="deposit" className="transition duration-300">
                Deposit
              </TabsTrigger>
              <TabsTrigger value="borrow" className="transition duration-300">
                Borrow
              </TabsTrigger>
              <TabsTrigger value="repay" className="transition duration-300">
                Repay
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="transition duration-300">
                Withdraw
              </TabsTrigger>
              <TabsTrigger
                value="liquidate"
                className="transition duration-300"
              >
                Liquidate
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="deposit"
              className="transition-all duration-300 ease-in-out"
            >
              <DepositTab />
            </TabsContent>
            <TabsContent
              value="borrow"
              className="transition-all duration-300 ease-in-out"
            >
              <BorrowTab />
            </TabsContent>
            <TabsContent
              value="repay"
              className="transition-all duration-300 ease-in-out"
            >
              <RepayTab />
            </TabsContent>
            <TabsContent
              value="withdraw"
              className="transition-all duration-300 ease-in-out"
            >
              <WithdrawTab />
            </TabsContent>
            <TabsContent
              value="liquidate"
              className="transition-all duration-300 ease-in-out"
            >
              <LiquidateTab />
            </TabsContent>
          </Tabs>
        </section>

        {error ? (
          <Card
            role="alert"
            className="border-black/10"
            style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <span
                className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-black"
                aria-hidden
              />
              <div>
                <p className="font-medium">Data failed to load</p>
                <p className="text-sm" style={{ color: "#666666" }}>
                  Please retry or check your connection.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
