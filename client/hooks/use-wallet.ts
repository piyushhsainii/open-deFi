"use client";

import { useCallback, useState } from "react";

type WalletState = {
  connected: boolean;
  address: string | null;
  isConnecting: boolean;
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    isConnecting: false,
  });

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true }));
    await new Promise((r) => setTimeout(r, 600));
    setState({
      connected: true,
      address: "7F7uS1HcG2rWnPq9XyZa1cDeMoNoPaYQ",
      isConnecting: false,
    });
  }, []);

  const disconnect = useCallback(() => {
    setState({ connected: false, address: null, isConnecting: false });
  }, []);

  return { ...state, connect, disconnect };
}
