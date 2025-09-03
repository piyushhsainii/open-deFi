"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useWallet } from "@solana/wallet-adapter-react";

const SUPPORTED_TOKENS = [
  { symbol: "TOKEN1", mint: "9SFMpR2owdeZpGRLomHsDtx5rEf2bVuo3XCgSjyAVUf4" },
  { symbol: "TOKEN2", mint: "J8NDF3RxtfZ5E2vks2NdchwE3PXNMNwUngCpEbMoLaoL" },
] as const;

function getAdminWallets(): string[] {
  // Allows configuring from env at build-time; fallback to empty (user can update).
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_WALLETS) {
    return process.env.NEXT_PUBLIC_ADMIN_WALLETS.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // TODO: Add your admin wallet(s) here or set NEXT_PUBLIC_ADMIN_WALLETS
  return [];
}

const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const formSchema = z
  .object({
    tokenMint: z.string().min(1, "Select a token"),
    authority: z
      .string()
      .regex(PUBKEY_REGEX, "Enter a valid Solana public key"),
    liquidationBonus: z.number().int().min(0).max(10000),
    closeFactor: z.number().int().min(0).max(10000),
    maxLtv: z.number().int().min(0).max(9999), // must be < 10000 (liquidation threshold)
    interestRate: z.number().int().min(0).max(2000),
  })
  .refine((v) => v.maxLtv < 10000, {
    message: "Max LTV must be less than 10000 (100%)",
    path: ["maxLtv"],
  });

type FormValues = z.infer<typeof formSchema>;

const defaultBps: Pick<
  FormValues,
  "liquidationBonus" | "closeFactor" | "maxLtv" | "interestRate"
> = {
  liquidationBonus: 500, // 5%
  closeFactor: 5000, // 50%
  maxLtv: 8000, // 80%
  interestRate: 1000, // 10% annual
};

async function initializeBank(
  values: FormValues
): Promise<{ signature: string }> {
  // simulate latency + success
  await new Promise((r) => setTimeout(r, 1200));
  // return a fake tx signature
  return { signature: "5xXhQ3t...mockTxSignature...d9Pg" };
}

export default function AdminBankInitPage() {
  const router = useRouter();
  const wallet = useWallet();
  const adminWallets = ["5NHvrqoZk4ov5GvKzDpsmEeW4URwLuG6P4HrmSDTqHc7"];
  //   const adminWallets = useMemo(getAdminWallets, []);
  const isAdmin =
    wallet.connected && wallet.publicKey
      ? adminWallets.includes(wallet.publicKey.toString())
      : false;

  console.log(wallet.publicKey?.toString());
  console.log(adminWallets[0]);

  const { register, handleSubmit, setValue, formState, watch, reset } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        tokenMint: SUPPORTED_TOKENS[0].mint,
        authority: wallet.publicKey?.toString() ?? "",
        ...defaultBps,
      },
      mode: "onChange",
    });

  // keep authority in sync with connected wallet to help admins
  useEffect(() => {
    if (wallet.publicKey) setValue("authority", wallet.publicKey.toString());
  }, [wallet.publicKey, setValue]);

  const values = watch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ackIrreversible, setAckIrreversible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const onSubmit = () => {
    // open confirm modal first
    setAckIrreversible(false);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await initializeBank(values);
      toastApi({
        title: "Bank initialized",
        description: `Transaction: ${res.signature}`,
      });
      setConfirmOpen(false);
      // optional: reset and navigate to dashboard
      reset({
        tokenMint: values.tokenMint,
        authority: wallet.publicKey?.toString() ?? "",
        ...defaultBps,
      });
      router.push("/dashboard");
    } catch (err) {
      toastApi({
        title: "Initialization failed",
        description: "Please check your connection and try again.",
      });
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
          {/* Use existing connect wallet button */}
          {/* We keep a quick inline button here for convenience */}
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
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          {/* Bank selection */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Selection</CardTitle>
              <CardDescription>
                Choose the token mint to initialize.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tokenMint">Token</Label>
                {/* Native select for robustness */}
                <select
                  id="tokenMint"
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  {...register("tokenMint")}
                >
                  {SUPPORTED_TOKENS.map((t) => (
                    <option key={t.mint} value={t.mint}>
                      {t.symbol} — {t.mint.slice(0, 6)}…{t.mint.slice(-4)}
                    </option>
                  ))}
                </select>
                {formState.errors.tokenMint && (
                  <p className="text-destructive text-sm">
                    {formState.errors.tokenMint.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Mint Address</Label>
                <Input readOnly value={values.tokenMint} />
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
                  {...register("authority", {
                    setValueAs: (v) => String(v).trim(),
                  })}
                />
                {formState.errors.authority && (
                  <p className="text-destructive text-sm">
                    {formState.errors.authority.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Liquidation Threshold</Label>
                <Input readOnly value="10000 (100%)" />
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
                  {...register("liquidationBonus", { valueAsNumber: true })}
                />
                {formState.errors.liquidationBonus && (
                  <p className="text-destructive text-sm">
                    {formState.errors.liquidationBonus.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(values.liquidationBonus || 0)}
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
                  {...register("closeFactor", { valueAsNumber: true })}
                />
                {formState.errors.closeFactor && (
                  <p className="text-destructive text-sm">
                    {formState.errors.closeFactor.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(values.closeFactor || 0)}
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
                  {...register("maxLtv", { valueAsNumber: true })}
                />
                {formState.errors.maxLtv && (
                  <p className="text-destructive text-sm">
                    {formState.errors.maxLtv.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(values.maxLtv || 0)}
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
                  {...register("interestRate", { valueAsNumber: true })}
                />
                {formState.errors.interestRate && (
                  <p className="text-destructive text-sm">
                    {formState.errors.interestRate.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Preview: {percent(values.interestRate || 0)}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Total Deposits</Label>
                <Input readOnly value="0" />
              </div>
              <div className="grid gap-2">
                <Label>Total Deposit Shares</Label>
                <Input readOnly value="0" />
              </div>
              <div className="grid gap-2">
                <Label>Total Borrowed</Label>
                <Input readOnly value="0" />
              </div>
              <div className="grid gap-2">
                <Label>Total Borrowed Shares</Label>
                <Input readOnly value="0" />
              </div>
              <div className="grid gap-2">
                <Label>Last Updated</Label>
                <Input readOnly value={new Date().toLocaleString()} />
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Estimated Fee: ~0.0005 SOL • Review all parameters before
                continuing.
              </p>

              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="submit"
                    disabled={!formState.isValid || wallet.connecting}
                    className="bg-black text-white hover:opacity-90"
                  >
                    Initialize Bank
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                          SUPPORTED_TOKENS.find(
                            (t) => t.mint === values.tokenMint
                          )?.symbol
                        }{" "}
                        ({values.tokenMint})
                      </span>

                      <span className="text-muted-foreground">Authority</span>
                      <span className="break-all">{values.authority}</span>

                      <span className="text-muted-foreground">
                        Liquidation Threshold
                      </span>
                      <span>10000 bps (100%)</span>

                      <span className="text-muted-foreground">Max LTV</span>
                      <span>
                        {values.maxLtv} bps ({percent(values.maxLtv || 0)})
                      </span>

                      <span className="text-muted-foreground">
                        Close Factor
                      </span>
                      <span>
                        {values.closeFactor} bps (
                        {percent(values.closeFactor || 0)})
                      </span>

                      <span className="text-muted-foreground">
                        Liquidation Bonus
                      </span>
                      <span>
                        {values.liquidationBonus} bps (
                        {percent(values.liquidationBonus || 0)})
                      </span>

                      <span className="text-muted-foreground">
                        Interest Rate (annual)
                      </span>
                      <span>
                        {values.interestRate} bps (
                        {percent(values.interestRate || 0)})
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
                        I understand this action will initialize the bank and is
                        irreversible.
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
            </CardFooter>
          </Card>
        </form>
      )}
    </main>
  );
}
