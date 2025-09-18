export const token_address = {
  usdc: "9SFMpR2owdeZpGRLomHsDtx5rEf2bVuo3XCgSjyAVUf4",
  sol: "J8NDF3RxtfZ5E2vks2NdchwE3PXNMNwUngCpEbMoLaoL",
};

export const PYTH_USDC_PRICE =
  "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";
export const PYTH_SOL_PRICE =
  "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

export const SUPPORTED_TOKENS = [
  {
    symbol: "USDC",
    mint: "9SFMpR2owdeZpGRLomHsDtx5rEf2bVuo3XCgSjyAVUf4",
    img: "https://mcvzbtnedtysipzkwmuz.supabase.co/storage/v1/object/public/uploads/usdc-devnet.png",
  },
  {
    symbol: "SOL",
    mint: "J8NDF3RxtfZ5E2vks2NdchwE3PXNMNwUngCpEbMoLaoL",
    img: "https://mcvzbtnedtysipzkwmuz.supabase.co/storage/v1/object/public/uploads/solana-coin.png",
  },
] as const;
