"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Bank = {
  closefactor: number;
  liqThreshold: number;
  liqBonus: number;
  maxLTV: number;
};

type BankInfo = {
  solBank: Bank;
  UsdcBank: Bank;
};

export function AccountSummary({
  loading,
  bankInfo,
}: {
  loading: boolean;
  bankInfo?: BankInfo;
}) {
  if (loading || !bankInfo) {
    return (
      <Card className="border-black/10">
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Skeleton className="h-16" style={{ backgroundColor: "#f0f0f0" }} />
          <Skeleton className="h-16" style={{ backgroundColor: "#f0f0f0" }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-black/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ color: "#666666" }}>
          Account Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="cursor-help rounded-md border border-black/10 p-4 transition"
                style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
              >
                <div className="text-xs uppercase" style={{ color: "#999999" }}>
                  SOL Liquidation Threshold
                </div>
                <div className="text-2xl font-bold">
                  {bankInfo.solBank.liqThreshold.toFixed(0)}%
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              When your SOL collateral ratio exceeds this threshold, positions
              may be liquidated.
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="cursor-help rounded-md border border-black/10 p-4 transition"
                style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
              >
                <div className="text-xs uppercase" style={{ color: "#999999" }}>
                  USDC Liquidation Threshold
                </div>
                <div className="text-2xl font-bold">
                  {bankInfo.UsdcBank.liqThreshold.toFixed(0)}%
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              When your USDC collateral ratio exceeds this threshold, positions
              may be liquidated.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
