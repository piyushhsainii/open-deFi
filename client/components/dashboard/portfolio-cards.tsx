"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

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
  data = {
    tokenA: {
      totalDeposited: 1250.5,
      totalBorrowed: 800.25,
      availableToBorrow: 450.75,
      healthFactor: 85,
    },
    tokenB: {
      totalDeposited: 2100.8,
      totalBorrowed: 1200.4,
      availableToBorrow: 900.4,
      healthFactor: 72,
    },
  },
}: {
  loading: boolean;
  data?: Data;
}) {
  const [selectedToken, setSelectedToken] = useState<"tokenA" | "tokenB">(
    "tokenA"
  );

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

  const currentData = data[selectedToken];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Deposited"
        value={formatUSD(currentData?.totalDeposited ?? 0)}
        selectedToken={selectedToken}
        onTokenSwitch={setSelectedToken}
      />
      <MetricCard
        title="Total Borrowed"
        value={formatUSD(currentData?.totalBorrowed ?? 0)}
        selectedToken={selectedToken}
        onTokenSwitch={setSelectedToken}
      />
      <MetricCard
        title="Available to Borrow"
        value={formatUSD(currentData?.availableToBorrow ?? 0)}
        selectedToken={selectedToken}
        onTokenSwitch={setSelectedToken}
      />
      <HealthCard
        value={currentData?.healthFactor ?? 0}
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
  value: string;
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
            selectedToken={selectedToken}
            onTokenSwitch={onTokenSwitch}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div
          key={`${title}-${selectedToken}`}
          className="text-xl font-semibold animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        >
          {value}
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

function formatUSD(n: number) {
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}
