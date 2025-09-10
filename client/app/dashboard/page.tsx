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
import { ArrowLeft, Check, Wallet } from "lucide-react";
import Link from "next/link";
import { useDashboardData } from "@/components/hooks/useDashboardData";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { token_address } from "@/lib/data";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Token } from "@/lib/format";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { LendingApp } from "../../../target/types/lending_app";
import { Program } from "@coral-xyz/anchor";
import IDL from "../../../programs/lending-app/src/build/lending_app.json";
import { toast } from "sonner";

function WalletConnectionMessage({ connecting }: { connecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full border-black/10 bg-white">
        <CardContent className="flex flex-col items-center gap-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
            <Wallet className="h-8 w-8 text-black" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-black">
              {connecting ? "Fetching wallet Status" : "Connect Your Wallet"}
            </h2>
            <p className="text-sm text-gray-600">
              {!connecting &&
                "Please connect your wallet to access the lending dashboard and view your account information."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const {
    connected,
    publicKey,
    connect,
    disconnect,
    connecting,
    sendTransaction,
  } = useWallet();
  const [alertDialogOpen, setalertDialogOpen] = useState(false);
  const [token, setToken] = useState<Token>("USDC");
  const [value, setValue] = useState("");
  const [isInitialzing, setisInitialzing] = useState<boolean | null>(null);

  const {
    error,
    loading,
    refetch,
    bankBalances,
    bankInfo,
    setuserAccountInfo,
    userAccountInfo,
  } = useDashboardData();

  console.log(error);

  if (error == "userNA" && alertDialogOpen == false) {
    setalertDialogOpen(true);
  }

  const initializeUser = async () => {
    if (publicKey == null) {
      setalertDialogOpen(true);
      return;
    }
    setisInitialzing(true);
    try {
      console.log(`Initializing the user ATA!`);
      const connection = new Connection(clusterApiUrl("devnet"), {
        commitment: "confirmed",
      });

      const program: Program<LendingApp> = new Program(IDL, {
        connection: connection,
      });

      const [userATA, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), publicKey!.toBuffer()],
        program.programId
      );

      const instruction = await program.methods
        .initUser()
        .accounts({
          mintAddress: token == "USDC" ? token_address.usdc : token_address.sol,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          signer: publicKey,
        })
        .instruction();

      const latestBlockHash = await connection.getLatestBlockhash({
        commitment: "confirmed",
      });

      const tx = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      }).add(instruction);

      const txSig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(txSig, "confirmed");
      const userInfo = await program.account.user.fetch(userATA);
      setuserAccountInfo(userInfo);
      setalertDialogOpen(false);
      setisInitialzing(false);
      toast(`Successfully Initialized User on Chain - ${txSig}`);
      console.log(`Successfully Initialized User on Chain - ${txSig}`);
      setalertDialogOpen(false);
      setTimeout(() => {
        setisInitialzing(null);
      }, 3000);
    } catch (error) {
      toast("Something went wrong initializing the user account");
      setalertDialogOpen(true);
      setisInitialzing(null);
    }
  };

  useEffect(() => {
    if (error == "userNA") {
      setalertDialogOpen(true);
    }
    if (userAccountInfo) {
      setalertDialogOpen(false);
    }
  }, []);

  const truncated = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : "Not connected";

  return (
    <main className="min-h-dvh bg-white text-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <Link
          href={"/"}
          className="flex items-center gap-1 cursor-pointer hover:gap-2 duration-200 transition-all mx-auto"
        >
          <ArrowLeft size={18} /> Back to Home
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

        {/* Conditional rendering based on wallet connection */}
        {!connected ? (
          <WalletConnectionMessage connecting={connecting} />
        ) : (
          <>
            <section aria-label="Portfolio overview" className="mb-6">
              <PortfolioCards
                loading={false}
                data={{
                  tokenA: {
                    availableToBorrow: bankBalances.tokenA.availableToBorrow,
                    healthFactor: bankBalances.tokenA.healthFactor,
                    totalBorrowed: bankBalances.tokenA.totalBorrowed,
                    totalDeposited: bankBalances.tokenA.totalDeposited,
                  },
                  tokenB: {
                    availableToBorrow: bankBalances.tokenB.availableToBorrow,
                    healthFactor: bankBalances.tokenB.healthFactor,
                    totalBorrowed: bankBalances.tokenB.totalBorrowed,
                    totalDeposited: bankBalances.tokenB.totalDeposited,
                  },
                }}
              />
            </section>

            <section aria-label="Account summary" className="mb-8">
              <AccountSummary loading={false} bankInfo={bankInfo} />
            </section>

            <section aria-label="Actions" className="mb-16">
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-white">
                  <TabsTrigger
                    value="deposit"
                    className="transition duration-300"
                  >
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger
                    value="borrow"
                    className="transition duration-300"
                  >
                    Borrow
                  </TabsTrigger>
                  <TabsTrigger
                    value="repay"
                    className="transition duration-300"
                  >
                    Repay
                  </TabsTrigger>
                  <TabsTrigger
                    value="withdraw"
                    className="transition duration-300"
                  >
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
                  <DepositTab
                    token={token}
                    setToken={setToken}
                    value={value}
                    setValue={setValue}
                  />
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
                    <p className="font-medium">
                      {" "}
                      Welcome to our Lending Protocol{" "}
                    </p>
                    <p className="text-sm" style={{ color: "#666666" }}>
                      Deposit some tokens to see account Info
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        <div className="">
          <AlertDialog
            open={alertDialogOpen}
            onOpenChange={(v) => setalertDialogOpen(v)}
          >
            <AlertDialogContent className=" py-4">
              <span className="" aria-hidden />
              <div>
                <AlertDialogTitle className="font-medium">
                  {" "}
                  Create an user profile to interact with Dashboard{" "}
                </AlertDialogTitle>
                <p className="text-sm pt-3" style={{ color: "#666666" }}>
                  Initialise user account to start deposit and borrow!
                </p>
              </div>
              <AlertDialogFooter>
                <Link href={"/"}>
                  <Button
                    variant={"secondary"}
                    className="flex gap-1 items-center cursor-pointer"
                  >
                    {" "}
                    <ArrowLeft /> back to home
                  </Button>
                </Link>
                <Button
                  variant={"default"}
                  className="flex  items-center cursor-pointer"
                  onClick={initializeUser}
                  disabled={isInitialzing ?? false}
                >
                  {" "}
                  {isInitialzing == true && (
                    <div className="flex gap-1 items-center">
                      Initializing User{" "}
                      <span className="animate-spin w-1 border-white border-l h-1 p-1 rounded-full mx-1 px-1"></span>
                    </div>
                  )}
                  {isInitialzing == false && (
                    <div className="flex gap-1 items-center justify-center">
                      {" "}
                      Success! <Check />{" "}
                    </div>
                  )}
                  {isInitialzing == null && <div>Initialize User</div>}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </main>
  );
}
