"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import {
  bankBalances,
  useDashboardData,
  UserAccInfo,
} from "../hooks/useDashboardData";

type TokenData = {
  totalDeposited: number;
  totalBorrowed: number;
  availableToBorrow: number;
  healthFactor: number; // 0-100
};

type Data = {
  tokenA: TokenData;
  tokenB: TokenData;
};

export function PortfolioCards({
  loading,
  bankInfo,
  userAccountInfo,
}: {
  loading: boolean;
  bankInfo: Data;
  userAccountInfo: UserAccInfo;
}) {
  const [selectedToken, setSelectedToken] = useState<"tokenA" | "tokenB">(
    "tokenA"
  );
  // token a = sol
  // token b = usdc
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-black/10">
            <CardContent className="p-4">
              <Skeleton
                className="mb-3 h-4 w-24"
                style={{ backgroundColor: "#f0f0f0" }}
              />
              <Skeleton
                className="h-7 w-28"
                style={{ backgroundColor: "#f0f0f0" }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentData = bankInfo[selectedToken];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Deposited"
        value={
          selectedToken == "tokenA"
            ? userAccountInfo.depositedSol
            : userAccountInfo.depositedUsdc
        }
        selectedToken={selectedToken}
        onTokenSwitch={setSelectedToken}
      />
      <MetricCard
        title="Total Borrowed"
        value={
          selectedToken == "tokenA"
            ? userAccountInfo.borrowedSol
            : userAccountInfo.borrowedUsdc
        }
        selectedToken={selectedToken}
        onTokenSwitch={setSelectedToken}
      />
      <MetricCard
        title="Available to Borrow"
        value={currentData.availableToBorrow}
        selectedToken={selectedToken}
        onTokenSwitch={setSelectedToken}
      />
      <HealthCard
        value={currentData.healthFactor}
        selectedToken={selectedToken}
        onTokenSwitch={setSelectedToken}
      />
    </div>
  );
}

function TokenSwitch({
  selectedToken,
  onTokenSwitch,
}: {
  selectedToken: "tokenA" | "tokenB";
  onTokenSwitch: (token: "tokenA" | "tokenB") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
      <button
        onClick={() => onTokenSwitch("tokenA")}
        className={`rounded-full px-2 py-1 text-xs font-medium transition-all duration-200 ${
          selectedToken === "tokenA"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Sol
      </button>
      <button
        onClick={() => onTokenSwitch("tokenB")}
        className={`rounded-full px-2 py-1 text-xs font-medium transition-all duration-200 ${
          selectedToken === "tokenB"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        USDC
      </button>
    </div>
  );
}

function MetricCard({
  title,
  value,
  selectedToken,
  onTokenSwitch,
}: {
  title: string;
  value: any;
  selectedToken: "tokenA" | "tokenB";
  onTokenSwitch: (token: "tokenA" | "tokenB") => void;
}) {
  return (
    <Card className="border-black/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm" style={{ color: "#666666" }}>
            {title}
          </CardTitle>
          <TokenSwitch
            selectedToken={
              title == "Available to Borrow"
                ? selectedToken == "tokenA"
                  ? "tokenB"
                  : "tokenA"
                : selectedToken
            }
            onTokenSwitch={onTokenSwitch}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div
          key={`${title}-${selectedToken}`}
          className="text-xl font-semibold animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        >
          {value.toString()}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthCard({
  value,
  selectedToken,
  onTokenSwitch,
}: {
  value: number;
  selectedToken: "tokenA" | "tokenB";
  onTokenSwitch: (token: "tokenA" | "tokenB") => void;
}) {
  return (
    <Card className="border-black/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm" style={{ color: "#666666" }}>
            Health Factor
          </CardTitle>
          <TokenSwitch
            selectedToken={selectedToken}
            onTokenSwitch={onTokenSwitch}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div
          key={`health-${selectedToken}`}
          className="mb-2 text-xl font-semibold animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        >
          {value.toFixed(0)}%
        </div>
        <Progress
          value={value}
          className="h-2 transition-all duration-500"
          key={`progress-${selectedToken}`}
        />
      </CardContent>
    </Card>
  );
}

function formatUSD(n: string) {
  const formatted_value = Number(n) / 1000000000;
  return formatted_value;
}
