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

export function useLendingData() {
  const { data, error, isLoading, mutate } = useSWR<LendingData>(
    "/lending",
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  );

  async function simulateTx() {
    await new Promise((r) => setTimeout(r, 900));
    return { tx: Math.random().toString(36).slice(2, 10) };
  }

  return {
    data,
    error,
    isLoading,
    async deposit(token: Token, amount: number) {
      const res = await simulateTx();
      mutate(
        (prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (token === "USDC") {
            next.balances.usdc -= amount;
            next.deposits.usdc += amount;
          } else {
            next.balances.sol -= amount;
            next.deposits.sol += amount;
          }
          next.totalDeposited =
            next.deposits.usdc * 1 + next.deposits.sol * 150;
          next.availableToBorrow += amount * (token === "USDC" ? 1 : 150) * 0.5;
          next.healthFactor = Math.min(100, next.healthFactor + 1);
          return next;
        },
        { revalidate: false }
      );
      return res;
    },
    async borrow(token: Token, amount: number) {
      const res = await simulateTx();
      mutate(
        (prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (token === "USDC") {
            next.debts.usdc += amount;
            next.balances.usdc += amount;
          } else {
            next.debts.sol += amount;
            next.balances.sol += amount;
          }
          next.totalBorrowed = next.debts.usdc * 1 + next.debts.sol * 150;
          next.availableToBorrow = Math.max(
            0,
            next.availableToBorrow - amount * (token === "USDC" ? 1 : 150)
          );
          next.healthFactor = Math.max(0, next.healthFactor - 2);
          return next;
        },
        { revalidate: false }
      );
      return res;
    },
    async repay(token: Token, amount: number) {
      const res = await simulateTx();
      mutate(
        (prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (token === "USDC") {
            next.debts.usdc = Math.max(0, next.debts.usdc - amount);
            next.balances.usdc = Math.max(0, next.balances.usdc - amount);
          } else {
            next.debts.sol = Math.max(0, next.debts.sol - amount);
            next.balances.sol = Math.max(0, next.balances.sol - amount);
          }
          next.totalBorrowed = next.debts.usdc * 1 + next.debts.sol * 150;
          next.availableToBorrow += amount * (token === "USDC" ? 1 : 150);
          next.healthFactor = Math.min(100, next.healthFactor + 2);
          return next;
        },
        { revalidate: false }
      );
      return res;
    },
    async withdraw(token: Token, amount: number) {
      const res = await simulateTx();
      mutate(
        (prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (token === "USDC") {
            next.deposits.usdc = Math.max(0, next.deposits.usdc - amount);
            next.balances.usdc += amount;
          } else {
            next.deposits.sol = Math.max(0, next.deposits.sol - amount);
            next.balances.sol += amount;
          }
          next.totalDeposited =
            next.deposits.usdc * 1 + next.deposits.sol * 150;
          next.availableToBorrow = Math.max(
            0,
            next.availableToBorrow - amount * (token === "USDC" ? 1 : 150) * 0.5
          );
          next.healthFactor = Math.max(0, next.healthFactor - 1);
          return next;
        },
        { revalidate: false }
      );
      return res;
    },
    async liquidate(position: LendingData["liquidatable"][number]) {
      const res = await simulateTx();
      mutate(
        (prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          next.liquidatable = prev.liquidatable.filter(
            (p) => p.account !== position.account
          );
          return next;
        },
        { revalidate: false }
      );
      return res;
    },
  };
}
