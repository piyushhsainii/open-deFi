"use client";

import useSWR from "swr";
import type { Token } from "@/lib/format";

type LendingData = {
  balances: { usdc: number; sol: number };
  deposits: { usdc: number; sol: number };
  debts: { usdc: number; sol: number };
  rates: {
    usdc: { depositAPY: number; borrowAPY: number };
    sol: { depositAPY: number; borrowAPY: number };
  };
  totalDeposited: number;
  totalBorrowed: number;
  availableToBorrow: number;
  healthFactor: number;
  netAPY: number;
  liqThreshold: number;
  safetyBuffer: number;
  liquidatable: Array<{
    account: string;
    debtUSD: number;
    collateralUSD: number;
    healthFactor: number;
    bonusPct: number;
  }>;
};

const fetcher = async (): Promise<LendingData> => {
  // Mock data; replace with on-chain program fetch in production
  const data: LendingData = {
    balances: { usdc: 1234.56, sol: 8.9 },
    deposits: { usdc: 980, sol: 3 },
    debts: { usdc: 100, sol: 0.2 },
    rates: {
      usdc: { depositAPY: 4.23, borrowAPY: 7.1 },
      sol: { depositAPY: 1.25, borrowAPY: 3.9 },
    },
    totalDeposited: 980 * 1 + 3 * 150,
    totalBorrowed: 100 * 1 + 0.2 * 150,
    availableToBorrow: 500,
    healthFactor: 72,
    netAPY: 2.35,
    liqThreshold: 85,
    safetyBuffer: 50,
    liquidatable: [
      {
        account: "9JtYHqPdA6LmNoPqRsTuVwXyZaBcDeFg",
        debtUSD: 250,
        collateralUSD: 260,
        healthFactor: 68,
        bonusPct: 0.08,
      },
      {
        account: "5AbCDeFgHiJkLmNoPqRsTuVwXyZaBcDe",
        debtUSD: 420,
        collateralUSD: 430,
        healthFactor: 64,
        bonusPct: 0.08,
      },
    ],
  };
  return data;
};
