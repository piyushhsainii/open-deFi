export interface UserAccount {
  publicKey: string;
  account: {
    depositedSol: string;
    depositedSolShares: string;
    borrowedSol: string;
    borrowedSolShares: string;
    depositedUsdc: string;
    depositedUsdcShares: string;
    borrowedUsdc: string;
    borrowedUsdcShares: string;
    mintAddress: string;
    healthFactor: string;
  };
}

// Example type for array
export type UserAccounts = UserAccount[];
