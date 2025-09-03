"use client";

export type FaucetRateStatus = {
  claimed: number;
  remaining: number;
  canClaim: boolean;
  resetTime: number;
};

const HOUR_MS = 1000 * 60 * 60;
const LIMIT = 10;

function getHourKey(address: string) {
  const currentHour = Math.floor(Date.now() / HOUR_MS);
  const key = `faucet_limit_${address}_${currentHour}`;
  const historyKey = `faucet_history_${address}`;
  return { key, historyKey, resetTime: (currentHour + 1) * HOUR_MS };
}

export function getRateStatus(address: string): FaucetRateStatus {
  const { key, resetTime } = getHourKey(address);
  let claimed = 0;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(key);
    claimed = raw ? Number(raw) || 0 : 0;
  }
  const remaining = Math.max(0, LIMIT - claimed);
  return { claimed, remaining, canClaim: remaining > 0, resetTime };
}

export function recordClaim(address: string, amount: number) {
  if (typeof window === "undefined") return;
  const { key } = getHourKey(address);
  const prev = Number(localStorage.getItem(key) || 0);
  localStorage.setItem(key, String(prev + amount));
}

export function addClaimRecord(
  address: string,
  entry: { mint: string; amount: number; ts: number; sig?: string }
) {
  if (typeof window === "undefined") return;
  recordClaim(address, entry.amount);
  const { historyKey } = getHourKey(address);
  const prev = JSON.parse(localStorage.getItem(historyKey) || "[]");
  prev.unshift(entry);
  localStorage.setItem(historyKey, JSON.stringify(prev.slice(0, 50)));
}

export function getHistory(
  address: string
): Array<{ mint: string; amount: number; ts: number; sig?: string }> {
  if (typeof window === "undefined") return [];
  const { historyKey } = getHourKey(address);
  return JSON.parse(localStorage.getItem(historyKey) || "[]");
}
