"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Data = {
  netAPY: number; // %
  liqThreshold: number; // %
};

export function AccountSummary({
  loading,
  data = {
    netAPY: 1,
    liqThreshold: 2,
  },
}: {
  loading: boolean;
  data?: Data;
}) {
  if (loading) {
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
                  Net APY
                </div>
                <div className="text-2xl font-bold">
                  {(data?.netAPY ?? 0).toFixed(2)}%
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Net APY reflects your overall rate after deposits and borrows.
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="cursor-help rounded-md border border-black/10 p-4 transition"
                style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
              >
                <div className="text-xs uppercase" style={{ color: "#999999" }}>
                  Liquidation Threshold
                </div>
                <div className="text-2xl font-bold">
                  {(data?.liqThreshold ?? 0).toFixed(0)}%
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              When your collateral ratio exceeds this threshold, positions may
              be liquidated.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
