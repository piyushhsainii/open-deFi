"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as DialogFooterUI,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast, toast as toastApi } from "@/hooks/use-toast";
import Link from "next/link";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import IDL from "../../../programs/lending-app/src/build/lending_app.json";
import { LendingApp } from "../../../target/types/lending_app";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { toast } from "sonner";
import { SUPPORTED_TOKENS } from "@/lib/data";

const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const defaultBps = {
  liquidationBonus: 500, // 5%
  closeFactor: 5000, // 50%
  maxLtv: 8000, // 80%
  interestRate: 1000, // 10% annual
};

export default function AdminBankInitPage() {
  const router = useRouter();
  const wallet = useWallet();
  const wallet2 = useAnchorWallet();
  const adminWallets = ["5NHvrqoZk4ov5GvKzDpsmEeW4URwLuG6P4HrmSDTqHc7"];

  // Form state using useState
  const [tokenMint, setTokenMint] = useState(
    "9SFMpR2owdeZpGRLomHsDtx5rEf2bVuo3XCgSjyAVUf4"
  );
  const [authority, setAuthority] = useState("");
  const [liquidationBonus, setLiquidationBonus] = useState(
    defaultBps.liquidationBonus
  );
  const [closeFactor, setCloseFactor] = useState(defaultBps.closeFactor);
  const [maxLtv, setMaxLtv] = useState(defaultBps.maxLtv);
  const [interestRate, setInterestRate] = useState(defaultBps.interestRate);
  const [totalDeposits, setTotalDeposits] = useState({
    totalDeposited: 0,
    totalDepositedShares: 0,
  });
  const [totalBorrowed, setTotalBorrowed] = useState({
    totalBorrowed: 0,
    totalBorrowedShares: 0,
  });
  // Form validation errors
  const [errors, setErrors] = useState({
    tokenMint: "",
    authority: "",
    liquidationBonus: "",
    closeFactor: "",
    maxLtv: "",
    interestRate: "",
  });

  // Bank initialization states
  const [isBankInitialized, setIsBankInitialized] = useState(false);
  const [isCheckingBankStatus, setIsCheckingBankStatus] = useState(false);
  const [lastUpdated, setlastUpdated] = useState<any>(null);
  // Dialog and loading states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ackIrreversible, setAckIrreversible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [LiquidationThreshold, setLiquidationThreshold] = useState(0);

  const isAdmin =
    wallet.connected && wallet.publicKey
      ? adminWallets.includes(wallet.publicKey.toString())
      : false;

  // Update authority when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      setAuthority(wallet.publicKey.toString());
    }
  }, [wallet.publicKey]);

  // Check bank initialization status when tokenMint or wallet changes
  useEffect(() => {
    if (wallet2 && tokenMint) {
      checkIfBankIsInitialized();
    }
  }, [wallet2, tokenMint]);

  // Validation functions
  const validateForm = () => {
    const newErrors = {
      tokenMint: "",
      authority: "",
      liquidationBonus: "",
      closeFactor: "",
      maxLtv: "",
      interestRate: "",
    };

    if (!tokenMint) {
      newErrors.tokenMint = "Select a token";
    }

    if (!authority) {
      newErrors.authority = "Authority is required";
    } else if (!PUBKEY_REGEX.test(authority)) {
      newErrors.authority = "Enter a valid Solana public key";
    }

    if (liquidationBonus < 0 || liquidationBonus > 10000) {
      newErrors.liquidationBonus = "Must be between 0 and 10000";
    }

    if (closeFactor < 0 || closeFactor > 10000) {
      newErrors.closeFactor = "Must be between 0 and 10000";
    }

    if (maxLtv < 0 || maxLtv >= 10000) {
      newErrors.maxLtv =
        "Must be between 0 and 9999 (less than liquidation threshold)";
    }

    if (interestRate < 0 || interestRate > 2000) {
      newErrors.interestRate = "Must be between 0 and 2000";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  function InlineToaster() {
    const { toasts, dismiss } = useToast();
    return (
      <ToastProvider swipeDirection="right">
        {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast
            key={id}
            {...props}
            onOpenChange={(open) => !open && dismiss(id)}
          >
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    );
  }

  const checkIfBankIsInitialized = async () => {
    if (!wallet2 || !tokenMint || !wallet) return;
    setIsCheckingBankStatus(true);
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const provider = new AnchorProvider(connection, wallet2, {
        commitment: "confirmed",
      });
      const program = new Program<LendingApp>(IDL, provider);

      const [bankAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("bank"), new PublicKey(tokenMint).toBuffer()],
        program.programId
      );

      const bankAccount = await program.account.bank.fetch(bankAddress);
      if (bankAccount) {
        console.log(`Bank already initialized:`, bankAccount);
        setTotalDeposits({
          totalDeposited: bankAccount.totalDeposits.toNumber(),
          totalDepositedShares: bankAccount.totalDepositShares.toNumber(),
        });
        setTotalBorrowed({
          totalBorrowed: bankAccount.totalBorrowed.toNumber(),
          totalBorrowedShares: bankAccount.totalBorrowedShares.toNumber(),
        });
        setlastUpdated(bankAccount.lastUpdated.toNumber());
        setAuthority(bankAccount.authority.toString());
        setLiquidationBonus(bankAccount.liquidationBonus.toNumber());
        setLiquidationThreshold(bankAccount.liquidationThreshold.toNumber());
        setCloseFactor(bankAccount.closeFactor.toNumber());
        setMaxLtv(bankAccount.maxLtv.toNumber());
        setInterestRate(bankAccount.interestRate.toNumber());
        setIsBankInitialized(true);
      } else {
        setIsBankInitialized(false);
      }
    } catch (error) {
      console.log("Bank not initialized yet or error:", error);
      setIsBankInitialized(false);
    } finally {
      setIsCheckingBankStatus(false);
    }
  };

  const onSubmit = (e: any) => {
    e.preventDefault();
    if (!validateForm()) return;

    // open confirm modal first
    setAckIrreversible(false);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (!wallet?.publicKey || !wallet || !wallet.signTransaction) {
        toast("Wallet not connected");
        return;
      }

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const provider = new AnchorProvider(connection, wallet2!, {
        commitment: "confirmed",
      });
      const program = new Program<LendingApp>(IDL, provider);

      // Check if bank is already initialized
      const [bankAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("bank"), new PublicKey(tokenMint).toBuffer()],
        program.programId
      );

      try {
        const existingBank = await program.account.bank.fetch(bankAddress);
        if (existingBank) {
          toast("Bank is already initialized for this token");
          setIsBankInitialized(true);
          setConfirmOpen(false);
          return;
        }
      } catch (error) {
        // Bank doesn't exist, proceed with initialization
      }

      const instruction = await program.methods
        .initBank(
          new BN(7000),
          new PublicKey(tokenMint),
          new BN(8000),
          new BN(liquidationBonus),
          new BN(closeFactor),
          new BN(interestRate)
        )
        .accounts({
          tokenMintAddress: new PublicKey(tokenMint),
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          signer: wallet?.publicKey,
        })
        .instruction();

      const recentBlockHash = await connection.getLatestBlockhash({
        commitment: "confirmed",
      });
      const tx = new Transaction({
        feePayer: wallet.publicKey,
        blockhash: recentBlockHash.blockhash,
        lastValidBlockHeight: recentBlockHash.lastValidBlockHeight,
      }).add(instruction);

      // const txSig = await connection.simulateTransaction(tx);

      const txSig = await wallet.sendTransaction(tx, connection);
      console.log(`Successfully done Tx signature - `, txSig);
      await connection.confirmTransaction(txSig);

      toastApi({
        title: "Bank initialized",
        description: `Transaction: ${txSig}`,
      });

      setConfirmOpen(false);
      setIsBankInitialized(true);

      // Reset form
      setTokenMint(SUPPORTED_TOKENS[0].mint);
      setAuthority(wallet.publicKey?.toString() ?? "");
      setLiquidationBonus(defaultBps.liquidationBonus);
      setCloseFactor(defaultBps.closeFactor);
      setMaxLtv(defaultBps.maxLtv);
      setInterestRate(defaultBps.interestRate);
    } catch (error) {
      console.error("Error initializing bank:", error);
      toast("Failed to initialize bank. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const percent = (bps: number) => (bps / 100).toFixed(2) + "%";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 font-sans">
      <InlineToaster />

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black text-balance">
            Admin Bank Initialization
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure and initialize a new lending bank. Basis points: 100 bps =
            1%.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {wallet.connected
              ? `Wallet: ${wallet.publicKey
                  ?.toString()
                  ?.slice(0, 6)}…${wallet.publicKey?.toString().slice(-4)}`
              : "Not connected"}
          </span>
          <Button
            variant="outline"
            onClick={wallet.connected ? wallet.disconnect : wallet.connect}
            disabled={wallet.connecting}
            className="border-black text-black bg-white"
          >
            {wallet.connecting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size={14} /> Connecting…
              </span>
            ) : wallet.connected ? (
              "Disconnect"
            ) : (
              "Connect Wallet"
            )}
          </Button>
        </div>
      </header>

      {/* Unauthorized notice */}
      {!wallet.connected ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect wallet to continue</CardTitle>
            <CardDescription>
              Admin access is required to initialize banks.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="default"
              onClick={async () => {
                await wallet.connect();
              }}
              disabled={wallet.connecting}
            >
              {wallet.connecting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size={14} /> Connecting…
                </span>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : !isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              The connected wallet does not have admin permissions. Set
              NEXT_PUBLIC_ADMIN_WALLETS or update the admin list.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/dashboard" className="text-sm underline">
              Go to dashboard
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-6">
          {/* Bank selection */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Selection</CardTitle>
              <CardDescription>
                Choose the token mint to initialize.
                {isCheckingBankStatus && (
                  <span className="ml-2 inline-flex items-center gap-2 text-blue-600">
                    <Spinner size={12} /> Checking bank status...
                  </span>
                )}
                {!isCheckingBankStatus && isBankInitialized && (
                  <span className="ml-2 text-green-600 font-medium">
                    ✅ Bank already initialized
                  </span>
                )}
                {!isCheckingBankStatus && !isBankInitialized && (
                  <span className="ml-2 text-orange-600 font-medium">
                    ⚠️ Bank not initialized
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tokenMint">Token</Label>
                <Select
                  onValueChange={(val) => setTokenMint(val)}
                  defaultValue={SUPPORTED_TOKENS[0].mint}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a token" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_TOKENS.map((t) => (
                      <SelectItem key={t.mint} value={t.mint}>
                        <div className="flex items-center gap-2">
                          <img src={t.img} alt={t.symbol} className="w-4 h-4" />
                          {t.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tokenMint && (
                  <p className="text-destructive text-sm">{errors.tokenMint}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Mint Address</Label>
                <Input readOnly value={tokenMint} />
              </div>
            </CardContent>
          </Card>

          {/* Config form */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Enter parameters in basis points (0 – 10000). Defaults are
                suggested.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="authority">Authority Wallet</Label>
                <Input
                  id="authority"
                  placeholder="Admin public key"
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value.trim())}
                />
                {errors.authority && (
                  <p className="text-destructive text-sm">{errors.authority}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Liquidation Threshold</Label>
                <Input readOnly value={LiquidationThreshold} />
                <p className="text-muted-foreground text-xs">
                  Fixed value. Max LTV must be less than this threshold.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="liquidationBonus">
                  Liquidation Bonus (bps)
                </Label>
                <Input
                  id="liquidationBonus"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10000}
                  value={liquidationBonus}
                  readOnly={isBankInitialized}
                  onChange={(e) =>
                    setLiquidationBonus(parseInt(e.target.value) || 0)
                  }
                />
                {errors.liquidationBonus && (
                  <p className="text-destructive text-sm">
                    {errors.liquidationBonus}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(liquidationBonus || 0)}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="closeFactor">Close Factor (bps)</Label>
                <Input
                  id="closeFactor"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10000}
                  value={closeFactor}
                  readOnly={isBankInitialized}
                  onChange={(e) =>
                    setCloseFactor(parseInt(e.target.value) || 0)
                  }
                />
                {errors.closeFactor && (
                  <p className="text-destructive text-sm">
                    {errors.closeFactor}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(closeFactor || 0)}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxLtv">Max LTV (bps)</Label>
                <Input
                  id="maxLtv"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9999}
                  value={maxLtv}
                  readOnly={isBankInitialized}
                  onChange={(e) => setMaxLtv(parseInt(e.target.value) || 0)}
                />
                {errors.maxLtv && (
                  <p className="text-destructive text-sm">{errors.maxLtv}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(maxLtv || 0)}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="interestRate">
                  Interest Rate (bps, annual)
                </Label>
                <Input
                  id="interestRate"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={2000}
                  value={interestRate}
                  readOnly={isBankInitialized}
                  onChange={(e) =>
                    setInterestRate(parseInt(e.target.value) || 0)
                  }
                />
                {errors.interestRate && (
                  <p className="text-destructive text-sm">
                    {errors.interestRate}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(interestRate || 0)}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Total Deposits</Label>
                <Input readOnly value={totalDeposits.totalDeposited} />
              </div>
              <div className="grid gap-2">
                <Label>Total Deposit Shares</Label>
                <Input readOnly value={totalDeposits.totalDepositedShares} />
              </div>
              <div className="grid gap-2">
                <Label>Total Borrowed</Label>
                <Input readOnly value={totalBorrowed.totalBorrowed} />
              </div>
              <div className="grid gap-2">
                <Label>Total Borrowed Shares</Label>
                <Input readOnly value={totalBorrowed.totalBorrowedShares} />
              </div>
              <div className="grid gap-2">
                <Label>Last Updated</Label>
                <Input readOnly value={lastUpdated ?? "0"} />
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Estimated Fee: ~0.0005 SOL • Review all parameters before
                continuing.
              </p>

              {!isBankInitialized && (
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="submit"
                      disabled={wallet.connecting || isCheckingBankStatus}
                      className="bg-black text-white hover:opacity-90"
                    >
                      {isCheckingBankStatus ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner size={16} /> Checking...
                        </span>
                      ) : (
                        "Initialize Bank"
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Confirm Initialization</DialogTitle>
                      <DialogDescription>
                        Review and confirm the parameters below.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Token</span>
                        <span>
                          {
                            SUPPORTED_TOKENS.find((t) => t.mint === tokenMint)
                              ?.symbol
                          }{" "}
                          ({tokenMint})
                        </span>

                        <span className="text-muted-foreground">Authority</span>
                        <span className="break-all">{authority}</span>

                        <span className="text-muted-foreground">
                          Liquidation Threshold
                        </span>
                        <span>10000 bps (100%)</span>

                        <span className="text-muted-foreground">Max LTV</span>
                        <span>
                          {maxLtv} bps ({percent(maxLtv || 0)})
                        </span>

                        <span className="text-muted-foreground">
                          Close Factor
                        </span>
                        <span>
                          {closeFactor} bps ({percent(closeFactor || 0)})
                        </span>

                        <span className="text-muted-foreground">
                          Liquidation Bonus
                        </span>
                        <span>
                          {liquidationBonus} bps (
                          {percent(liquidationBonus || 0)})
                        </span>

                        <span className="text-muted-foreground">
                          Interest Rate (annual)
                        </span>
                        <span>
                          {interestRate} bps ({percent(interestRate || 0)})
                        </span>
                      </div>

                      <label className="mt-3 flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={ackIrreversible}
                          onChange={(e) => setAckIrreversible(e.target.checked)}
                          aria-label="Acknowledge irreversible action"
                        />
                        <span>
                          I understand this action will initialize the bank and
                          is irreversible.
                        </span>
                      </label>
                    </div>

                    <DialogFooterUI>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={onConfirm}
                        disabled={!ackIrreversible || isSubmitting}
                        className="bg-black text-white hover:opacity-90"
                      >
                        {isSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner size={16} /> Initializing…
                          </span>
                        ) : (
                          "Confirm & Initialize"
                        )}
                      </Button>
                    </DialogFooterUI>
                  </DialogContent>
                </Dialog>
              )}

              {isBankInitialized && (
                <div className="text-sm text-green-600 font-medium">
                  Bank is already initialized for this token
                </div>
              )}
            </CardFooter>
          </Card>
        </form>
      )}
    </main>
  );
}
