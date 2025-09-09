import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import { LendingApp } from "../../../target/types/lending_app";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import IDL from "../../../programs/lending-app/src/build/lending_app.json";
import { SUPPORTED_TOKENS } from "@/app/admin/page";

interface UserAccountInfo {
  tokenA: {
    availableToBorrow: number;
    healthFactor: number;
    totalBorrowed: number;
    totalDeposited: number;
  };
  tokenB: {
    availableToBorrow: number;
    healthFactor: number;
    totalBorrowed: number;
    totalDeposited: number;
  };
}

export const useDashboardData = () => {
  const { connected, publicKey } = useWallet();
  const [bankInfo, setbankInfo] = useState<{
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
  }>({
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
  const [userAccountInfo, setUserAccountInfo] = useState<UserAccountInfo>({
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
      setUserAccountInfo({
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

      const getAccountATA = await program.account.user.fetch(user, "confirmed");

      // Load in Banks
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

      const solMaxLtv = Math.floor(solBankInfo.maxLtv / 10000);
      const usdcMaxLtv = Math.floor(usdcBankInfo.maxLtv / 10000);

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
      const solAvailableToBorrow = Math.floor(
        getAccountATA.depositedSol * solMaxLtv
      );
      const liquidationThreshold = Math.floor(
        solBankInfo.liquidationThreshold / 10000
      );
      const solHealthFactor =
        getAccountATA.borrowedUsdc > 0
          ? Math.floor(
              Math.floor(getAccountATA.depositedSol * liquidationThreshold) /
                getAccountATA.borrowedUsdc
            )
          : 0;

      // Calculate USDC available to borrow and health factor
      const usdcAvailableToBorrow = Math.floor(
        getAccountATA.depositedUsdc * usdcMaxLtv
      );
      const usdcLiquidationThreshold = Math.floor(
        usdcBankInfo.liquidationThreshold / 10000
      );
      const usdcHealthFactor =
        getAccountATA.borrowedSol > 0
          ? Math.floor(
              Math.floor(
                getAccountATA.depositedUsdc * usdcLiquidationThreshold
              ) / getAccountATA.borrowedSol
            )
          : 0;

      setUserAccountInfo({
        tokenA: {
          // SOL
          availableToBorrow: solAvailableToBorrow ?? 0,
          healthFactor: solHealthFactor,
          totalBorrowed: getAccountATA.borrowedSol,
          totalDeposited: getAccountATA.depositedSol,
        },
        tokenB: {
          // USDC
          availableToBorrow: usdcAvailableToBorrow ?? 0,
          healthFactor: usdcHealthFactor,
          totalBorrowed: getAccountATA.borrowedUsdc,
          totalDeposited: getAccountATA.depositedUsdc,
        },
      });
    } catch (err) {
      console.log(`Something went wrong -`, err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setUserAccountInfo({
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
    userAccountInfo,
    bankInfo,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
