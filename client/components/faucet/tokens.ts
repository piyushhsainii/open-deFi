export const TOKENS = [
  {
    symbol: "TKN1",
    name: "Faucet Token 1",
    mint: "9SFMpR2owdeZpGRLomHsDtx5rEf2bVuo3XCgSjyAVUf4",
  },
  {
    symbol: "TKN2",
    name: "Faucet Token 2",
    mint: "J8NDF3RxtfZ5E2vks2NdchwE3PXNMNwUngCpEbMoLaoL",
  },
] as const;

export type FaucetToken = (typeof TOKENS)[number];
