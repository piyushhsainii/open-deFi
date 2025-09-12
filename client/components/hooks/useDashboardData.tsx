import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program, BN } from "@coral-xyz/anchor";
import { LendingApp } from "../../../target/types/lending_app";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import IDL from "../../../programs/lending-app/src/build/lending_app.json";
import { SUPPORTED_TOKENS } from "@/app/admin/page";

export interface bankBalances {
  tokenA: {
    availableToBorrow: any;
    healthFactor: any;
    totalBorrowed: any;
    totalDeposited: any;
  };
  tokenB: {
    availableToBorrow: any;
    healthFactor: any;
    totalBorrowed: any;
    totalDeposited: any;
  };
}

export interface UserAccInfo {
  depositedSol: string;
  depositedSolShares: string;
  borrowedSol: string;
  borrowedSolShares: string;
  depositedUsdc: string;
  depositedUsdcShares: string;
  borrowedUsdc: string;
  borrowedUsdcShares: string;
  mintAddress: PublicKey;
  healthFactor: string;
}

export interface BankInfo {
  solBank: {
    closefactor: number;
    liqThreshold: number;
    liqBonus: number;
    maxLTV: number;
  };
  UsdcBank: {
    closefactor: number;
    liqThreshold: number;
    liqBonus: number;
    maxLTV: number;
  };
}

export const useDashboardData = () => {
  const { connected, publicKey } = useWallet();
  const [bankInfo, setbankInfo] = useState<BankInfo>({
    solBank: {
      closefactor: 0,
      liqThreshold: 0,
      liqBonus: 0,
      maxLTV: 0,
    },
    UsdcBank: {
      closefactor: 0,
      liqThreshold: 0,
      liqBonus: 0,
      maxLTV: 0,
    },
  });

  const [userAccountInfo, setuserAccountInfo] = useState<UserAccInfo | null>(
    null
  );
  const [bankBalances, setBankBalances] = useState<bankBalances>({
    tokenA: {
      availableToBorrow: 0,
      healthFactor: 0,
      totalBorrowed: 0,
      totalDeposited: 0,
    },
    tokenB: {
      availableToBorrow: 0,
      healthFactor: 0,
      totalBorrowed: 0,
      totalDeposited: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!connected || !publicKey) {
      setBankBalances({
        tokenA: {
          availableToBorrow: 0,
          healthFactor: 0,
          totalBorrowed: 0,
          totalDeposited: 0,
        },
        tokenB: {
          availableToBorrow: 0,
          healthFactor: 0,
          totalBorrowed: 0,
          totalDeposited: 0,
        },
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const program: Program<LendingApp> = new Program(IDL, {
        connection: connection,
      });

      const [user] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), publicKey.toBuffer()],
        program.programId
      );
      let accountInfo: {
        depositedSol: BN;
        depositedSolShares: BN;
        borrowedSol: BN;
        borrowedSolShares: BN;
        depositedUsdc: BN;
        depositedUsdcShares: BN;
        borrowedUsdc: BN;
        borrowedUsdcShares: BN;
        mintAddress: PublicKey;
        healthFactor: BN;
      };
      try {
        const getAccATA = await program.account.user.fetch(user, "confirmed");
        setuserAccountInfo({
          borrowedSol: getAccATA.borrowedSol.toString(),
          borrowedSolShares: getAccATA.borrowedSolShares.toString(),
          borrowedUsdc: getAccATA.borrowedUsdc.toString(),
          borrowedUsdcShares: getAccATA.borrowedUsdcShares.toString(),
          depositedSol: getAccATA.depositedSol.toString(),
          depositedSolShares: getAccATA.depositedSolShares.toString(),
          depositedUsdc: getAccATA.depositedUsdc.toString(),
          depositedUsdcShares: getAccATA.depositedUsdcShares.toString(),
          healthFactor: getAccATA.healthFactor.toString(), // small scalar → safe
          mintAddress: getAccATA.mintAddress,
        });
        accountInfo = getAccATA;
      } catch (error) {
        return setError("userNA");
      }
      // Sol Bank
      const [solBankATA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bank"),
          new PublicKey(SUPPORTED_TOKENS[1].mint).toBuffer(),
        ],
        program.programId
      );

      // USDC Bank
      const [usdcBankATA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bank"),
          new PublicKey(SUPPORTED_TOKENS[0].mint).toBuffer(),
        ],
        program.programId
      );

      const solBankInfo = await program.account.bank.fetch(
        new PublicKey(solBankATA),
        "confirmed"
      );
      const usdcBankInfo = await program.account.bank.fetch(
        new PublicKey(usdcBankATA),
        "confirmed"
      );
      console.log(
        `SOL BANK TOTAL DEPOSIT`,
        solBankInfo.totalDeposits.toNumber()
      );
      console.log(`USDC BANK INFO`, usdcBankInfo.totalDepositShares.toNumber());
      console.log(`SOL BANK INFO`, solBankInfo.totalDepositShares.toNumber());
      const solMaxLtv = Number(
        Number(solBankInfo.maxLtv.toNumber() / 10000).toFixed(2)
      );
      const usdcMaxLtv = Number(
        Number(usdcBankInfo.maxLtv.toNumber() / 10000).toFixed(2)
      );

      const solBank = {
        closefactor: solBankInfo.closeFactor.toNumber(),
        liqThreshold: solBankInfo.liquidationThreshold.toNumber(),
        liqBonus: solBankInfo.liquidationBonus.toNumber(),
        maxLTV: solBankInfo.maxLtv.toNumber(),
      };
      const UsdcBank = {
        closefactor: usdcBankInfo.closeFactor.toNumber(),
        liqThreshold: usdcBankInfo.liquidationThreshold.toNumber(),
        liqBonus: usdcBankInfo.liquidationBonus.toNumber(),
        maxLTV: usdcBankInfo.maxLtv.toNumber(),
      };
      setbankInfo({
        solBank,
        UsdcBank,
      });

      if (accountInfo == null) {
        setError("userNa");
        return;
      }

      const solAvailableToBorrow = Number(
        solMaxLtv * Number(accountInfo.depositedSol.toString())
      ).toFixed(2);

      // Calculate USDC available to borrow and health factor
      const usdcAvailableToBorrow = Number(
        Number(accountInfo.depositedUsdc.toString()) * usdcMaxLtv
      ).toFixed(2);

      const liquidationThreshold = Number(
        solBankInfo.liquidationThreshold.toNumber() / 10000
      );
      const usdcLiquidationThreshold = Number(
        usdcBankInfo.liquidationThreshold.toNumber() / 1000
      );

      const solHealthFactor =
        accountInfo.borrowedUsdc.toNumber() > 0
          ? (
              Number(
                Number(accountInfo.depositedSol.toNumber()) *
                  liquidationThreshold
              ) / accountInfo.borrowedUsdc.toNumber()
            ).toFixed(2)
          : 100;
      const usdcHealthFactor =
        accountInfo.borrowedSol.toNumber() > 0
          ? (
              Number(
                Number(accountInfo.depositedUsdc.toNumber()) *
                  usdcLiquidationThreshold
              ) / accountInfo.borrowedSol.toNumber()
            ).toFixed(2)
          : 100;

      setBankBalances({
        tokenA: {
          // SOL
          availableToBorrow: solAvailableToBorrow ?? 0,
          healthFactor: solHealthFactor,
          totalBorrowed: accountInfo.borrowedSol,
          totalDeposited: accountInfo.depositedSol,
        },
        tokenB: {
          // USDC
          availableToBorrow: usdcAvailableToBorrow ?? 0,
          healthFactor: usdcHealthFactor,
          totalBorrowed: accountInfo.borrowedUsdc,
          totalDeposited: accountInfo.depositedUsdc,
        },
      });
    } catch (err) {
      console.log(`Something went wrong -`, err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setBankBalances({
        tokenA: {
          availableToBorrow: 0,
          healthFactor: 0,
          totalBorrowed: 0,
          totalDeposited: 0,
        },
        tokenB: {
          availableToBorrow: 0,
          healthFactor: 0,
          totalBorrowed: 0,
          totalDeposited: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [connected, publicKey]);

  return {
    bankBalances,
    bankInfo,
    loading,
    error,
    refetch: fetchDashboardData,
    userAccountInfo,
    setuserAccountInfo,
  };
};
