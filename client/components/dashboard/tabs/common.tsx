"use client";

import type React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Token } from "@/lib/format";
import { Info } from "lucide-react";

export function TokenSelector({
  token,
  onChange,
  disabled,
}: {
  token: Token;
  onChange: (t: Token) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={token}
      onValueChange={(v) => onChange(v as Token)}
      disabled={disabled}
    >
      <SelectTrigger className="border-black">
        <SelectValue placeholder="Select a token" />
      </SelectTrigger>
      <SelectContent>
        {(["USDC", "SOL"] as Token[]).map((t, idx) => (
          <>
            <SelectItem key={t} value={t}>
              <span className="inline-flex items-center gap-2">
                <img
                  src={
                    idx == 0
                      ? "https://mcvzbtnedtysipzkwmuz.supabase.co/storage/v1/object/public/uploads/usdc-devnet.png"
                      : "https://mcvzbtnedtysipzkwmuz.supabase.co/storage/v1/object/public/uploads/solana-coin.png"
                  }
                  alt={`${t} logo`}
                  className="h-5 w-5"
                />
                {t}
              </span>
            </SelectItem>
          </>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AmountInput({
  token,
  value,
  onChange,
  onMax,
  label = "Amount",
  maxLabel = "Max",
  disabled,
}: {
  token: Token;
  value: string;
  onChange: (v: string) => void;
  onMax?: () => void;
  label?: string;
  maxLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm" style={{ color: "#666666" }}>
          {label}
        </label>
        {onMax ? (
          <Button
            type="button"
            variant="ghost"
            className="h-7 px-2 text-xs transition hover:scale-[1.02]"
            onClick={onMax}
          >
            {maxLabel}
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="0.00"
          className="border-black focus-visible:ring-0"
          aria-label={`${label} in ${token}`}
          step={0.01}
          type="number"
          min="0"
        />
        <span
          className="min-w-16 rounded border border-black/10 px-3 py-2 text-center font-mono text-sm"
          style={{ backgroundColor: "rgba(51,51,51,0.03)" }}
        >
          {token}
        </span>
      </div>
    </div>
  );
}

export function FieldHelp({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs" style={{ color: "#666666" }}>
      {children}
    </div>
  );
}

export function Feedback({
  state,
  hash,
  message,
}: {
  state: "idle" | "loading" | "success" | "error";
  hash?: string;
  message?: string;
}) {
  if (state === "loading") {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <Spinner /> Processing transaction…
      </div>
    );
  }
  if (state === "success") {
    return (
      <div className="text-sm">
        Success.{" "}
        {hash ? (
          <a href="#" className="underline" onClick={(e) => e.preventDefault()}>
            Tx: <span className="font-mono">{hash.slice(0, 8)}…</span>
          </a>
        ) : null}
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-black"
          aria-hidden
        />
        {message || "Transaction failed"}
      </div>
    );
  }
  return null;
}
