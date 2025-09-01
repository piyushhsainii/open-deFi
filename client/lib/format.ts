export type Token = "USDC" | "SOL";

export const tokenMeta: Record<Token, { decimals: number }> = {
  USDC: { decimals: 6 },
  SOL: { decimals: 9 },
};

export function formatToken(amount: number, token: Token) {
  const { decimals } = tokenMeta[token];
  const fixed = amount.toFixed(Math.min(decimals, 6));
  return fixed.replace(/\.?0+$/, "");
}

export function parseAmount(input: string, token: Token) {
  const cleaned = input.replace(/[^\d.]/g, "");
  const value = Number(cleaned);
  if (!isFinite(value)) return 0;
  const { decimals } = tokenMeta[token];
  const parts = cleaned.split(".");
  if (parts[1]?.length > decimals) {
    return Number(parts[0] + "." + parts[1].slice(0, decimals));
  }
  return value;
}
