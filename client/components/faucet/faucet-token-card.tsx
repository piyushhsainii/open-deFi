"use client";

import { Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaucetToken } from "./tokens";

export function FaucetTokenCard({
  token,
  selected,
  onSelect,
}: {
  token: FaucetToken;
  selected: boolean;
  onSelect: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token.mint);
    } catch {}
  };

  const short = `${token.mint.slice(0, 4)}...${token.mint.slice(-4)}`;
  return (
    <Card className={`p-4 ${selected ? "ring-2 ring-black" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-600">{token.name}</div>
          <div className="flex items-center gap-1">
            <img src={token.img} alt="" className="w-6 h-6" />
            <div className="text-lg font-semibold text-black">
              {token.symbol}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
            <span className="font-mono">{short}</span>
            <button
              onClick={copy}
              className="rounded border border-gray-200 px-1.5 py-0.5 text-gray-600 hover:bg-gray-100"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <Button
          onClick={onSelect}
          variant="default"
          className="rounded-full bg-black px-3 py-1 text-white hover:scale-[1.02]"
        >
          Select Token
        </Button>
      </div>
    </Card>
  );
}
