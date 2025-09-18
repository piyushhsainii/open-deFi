"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldHelp, Feedback } from "./common";
import { Dispatch, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BankInfo } from "@/components/hooks/useDashboardData";
import { UserAccounts } from "@/lib/types";

/**
 * Helper: parse a numeric string that might be:
 *  - hex (like "7d2b7500" or "0x7d2b7500")
 *  - decimal (like "2100000000")
 */
const parseNumberString = (val?: string) => {
  if (!val) return 0;
  const s = String(val).trim();
  if (s.length === 0) return 0;
  const looksLikeHex = /^0x/i.test(s) || /[a-fA-F]/.test(s);
  return looksLikeHex ? parseInt(s.replace(/^0x/i, ""), 16) : parseInt(s, 10);
};

/** convert atomic value (string) -> ui value (number) using decimals */
const toUiAmount = (val: string | undefined, decimals: number) => {
  const base = parseNumberString(val);
  if (!Number.isFinite(base)) return 0;
  return base / Math.pow(10, decimals);
};

// safe number helper
const safe = (n: any, fallback = 0) =>
  Number.isFinite(Number(n)) ? Number(n) : fallback;

export default function LiquidateTab({
  Positions,
  setPositions,
  bankInfo,
  maxSafeWithDrawal,
  HealthFactorSol,
  HealthFactorUsdc,
  solPrice = 100, // fallback price for SOL
  usdcPrice = 1, // fallback price for USDC
}: {
  Positions: UserAccounts;
  setPositions: Dispatch<any>;
  bankInfo: BankInfo;
  maxSafeWithDrawal: {
    usdc: number;
    sol: number;
  };
  HealthFactorSol: number;
  HealthFactorUsdc: number;
  solPrice?: number;
  usdcPrice?: number;
}) {
  const { connected } = useWallet();
  const [selected, setSelected] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const onLiquidate = async () => {
    if (selected === null) return;
    setState("loading");
    setError(undefined);
    setHash(undefined);
    try {
      // call your liquidation logic here...
      setState("success");
      setHash("tx");
      setSelected(null);
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Network error");
    }
  };

  const processedAccounts = Positions.map((pos) => {
    const borrowedSol = toUiAmount(pos.account?.borrowedSol, 9);
    const borrowedUsdc = toUiAmount(pos.account?.borrowedUsdc, 6);
    const depositedSol = toUiAmount(pos.account?.depositedSol, 9);
    const depositedUsdc = toUiAmount(pos.account?.depositedUsdc, 6);

    const healthFactor = parseNumberString(pos.account?.healthFactor) || 0;

    const closeFactorSol = safe(bankInfo.solBank?.closefactor, 0) / 10000;
    const closeFactorUsdc = safe(bankInfo.UsdcBank?.closefactor, 0) / 10000;
    const liqBonusSol = safe(bankInfo.solBank?.liqBonus, 0) / 10000;
    const liqBonusUsdc = safe(bankInfo.UsdcBank?.liqBonus, 0) / 10000;

    const maxRepaySol = borrowedSol * closeFactorSol;
    const maxRepayUsdc = borrowedUsdc * closeFactorUsdc;

    const maxLiqSol = Math.min(maxRepaySol, depositedSol);
    const maxLiqUsdc = Math.min(maxRepayUsdc, depositedUsdc);

    const profitSol = maxLiqSol * liqBonusSol * solPrice;
    const profitUsdc = maxLiqUsdc * liqBonusUsdc * usdcPrice;

    // total collateral and debt (in USD terms)
    const totalCollateral = depositedSol * solPrice + depositedUsdc * usdcPrice;
    const totalDebt = borrowedSol * solPrice + borrowedUsdc * usdcPrice;

    // detect bad debt (no collateral left, but still owing debt)
    const badDebt = totalCollateral <= 0 && totalDebt > 0;

    return {
      account: pos.publicKey.toString(),
      healthFactor,
      borrowedSol,
      borrowedUsdc,
      depositedSol,
      depositedUsdc,
      maxLiqSol,
      maxLiqUsdc,
      profitSol,
      profitUsdc,
      totalCollateral,
      totalDebt,
      badDebt,
    };
  });

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <Card className="border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Liquidate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Positions.length === 0 ? (
          <div
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: "#666666" }}
          >
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-black"
              aria-hidden
            />
            No positions available for liquidation
          </div>
        ) : (
          <div className="space-y-4">
            {processedAccounts.map((account, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg p-6 hover:bg-gray-250 transition-colors"
              >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {/* Account Address */}
                    <div>
                      <div className="text-gray-400 text-sm">
                        Account Address
                      </div>
                      <div className="text-blue-400 font-mono font-semibold">
                        {truncateAddress(account.account)}
                      </div>
                    </div>

                    {/* Health Factor */}
                    <div>
                      <div className="text-gray-400 text-sm">Health Factor</div>
                      <div
                        className={`font-bold text-lg ${
                          account.healthFactor < 1
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {account.healthFactor}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-right">
                    {account.badDebt ? (
                      <div className="text-red-600 font-bold text-lg">
                        Bad Debt — cannot liquidate
                      </div>
                    ) : (
                      <div className="text-green-600 font-bold text-lg">
                        Eligible
                      </div>
                    )}
                  </div>
                </div>

                {/* Asset Breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-100 rounded p-3">
                    <div className="text-black text-xs mb-1">Borrowed</div>
                    <div className="text-red-300 font-bold space-y-1">
                      <div>SOL: {account.borrowedSol}</div>
                      <div>USDC: {account.borrowedUsdc}</div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded p-3">
                    <div className="text-black text-xs mb-1">Collateral</div>
                    <div className="text-green-300 font-bold space-y-1">
                      <div>SOL: {account.depositedSol}</div>
                      <div>USDC: {account.depositedUsdc}</div>
                    </div>
                  </div>
                </div>

                {/* Liquidation Details */}
                {!account.badDebt && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-gray-400 text-sm">Max Liq (SOL)</div>
                      <div className="text-yellow-400 font-semibold text-lg">
                        {account.maxLiqSol}
                      </div>
                      <div className="text-xs text-green-600">
                        Profit ≈ {safe(account.profitSol).toFixed(4)} USD
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">
                        Max Liq (USDC)
                      </div>
                      <div className="text-yellow-400 font-semibold text-lg">
                        {account.maxLiqUsdc}
                      </div>
                      <div className="text-xs text-green-600">
                        Profit ≈ {safe(account.profitUsdc).toFixed(4)} USD
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  {!account.badDebt ? (
                    <>
                      <Button
                        onClick={onLiquidate}
                        disabled={
                          !connected ||
                          selected === null ||
                          state === "loading" ||
                          Positions.length === 0
                        }
                        className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
                        variant="outline"
                      >
                        {state === "loading"
                          ? "Liquidating…"
                          : "Liquidate (SOL)"}
                      </Button>
                      <Button
                        onClick={onLiquidate}
                        disabled={
                          !connected ||
                          selected === null ||
                          state === "loading" ||
                          Positions.length === 0
                        }
                        className="border-black text-black transition duration-300 hover:scale-[1.02] hover:shadow-sm bg-transparent"
                        variant="outline"
                      >
                        {state === "loading"
                          ? "Liquidating…"
                          : "Liquidate (USDC)"}
                      </Button>
                      <Feedback state={state} hash={hash} message={error} />
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No collateral left — liquidation disabled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <FieldHelp>
          Liquidations repay debt and claim collateral with a protocol-defined
          bonus. Bad debt cannot be liquidated.
        </FieldHelp>
      </CardContent>
    </Card>
  );
}
