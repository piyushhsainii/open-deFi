import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import { LendingApp } from "../../../target/types/lending_app";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import IDL from "../../../programs/lending-app/src/build/lending_app.json";
import { SUPPORTED_TOKENS } from "@/app/admin/page";

interface bankBalances {
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

interface UserAccInfo {
  depositedSol: number;
  depositedSolShares: number;
  borrowedSol: number;
  borrowedSolShares: number;
  depositedUsdc: number;
  depositedUsdcShares: number;
  borrowedUsdc: number;
  borrowedUsdcShares: number;
  mintAddress: PublicKey;
  healthFactor: number;
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
      let getAccountATA;
      try {
        const getAccATA = await program.account.user.fetch(user, "confirmed");
        setuserAccountInfo({
          borrowedSol: getAccATA.borrowedSol.toNumber(),
          borrowedSolShares: getAccATA.borrowedSolShares.toNumber(),
          borrowedUsdc: getAccATA.borrowedUsdc.toNumber(),
          borrowedUsdcShares: getAccATA.borrowedUsdcShares.toNumber(),
          depositedSol: getAccATA.depositedSol.toNumber(),
          depositedSolShares: getAccATA.depositedSolShares.toNumber(),
          depositedUsdc: getAccATA.depositedUsdc.toNumber(),
          depositedUsdcShares: getAccATA.depositedUsdcShares.toNumber(),
          healthFactor: getAccATA.healthFactor.toNumber(),
          mintAddress: getAccATA.mintAddress,
        });
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

      if (userAccountInfo == null) {
        setError("userNa");
        return;
      }

      const solAvailableToBorrow = Math.floor(
        userAccountInfo.depositedSol * solMaxLtv
      );
      const liquidationThreshold = Math.floor(
        solBankInfo.liquidationThreshold / 10000
      );
      const solHealthFactor =
        userAccountInfo.borrowedUsdc > 0
          ? Math.floor(
              Math.floor(userAccountInfo.depositedSol * liquidationThreshold) /
                userAccountInfo.borrowedUsdc
            )
          : 0;

      // Calculate USDC available to borrow and health factor
      const usdcAvailableToBorrow = Math.floor(
        userAccountInfo.depositedUsdc * usdcMaxLtv
      );
      const usdcLiquidationThreshold = Math.floor(
        usdcBankInfo.liquidationThreshold / 10000
      );
      const usdcHealthFactor =
        userAccountInfo.borrowedSol > 0
          ? Math.floor(
              Math.floor(
                userAccountInfo.depositedUsdc * usdcLiquidationThreshold
              ) / userAccountInfo.borrowedSol
            )
          : 0;

      setBankBalances({
        tokenA: {
          // SOL
          availableToBorrow: solAvailableToBorrow ?? 0,
          healthFactor: solHealthFactor,
          totalBorrowed: userAccountInfo.borrowedSol,
          totalDeposited: userAccountInfo.depositedSol,
        },
        tokenB: {
          // USDC
          availableToBorrow: usdcAvailableToBorrow ?? 0,
          healthFactor: usdcHealthFactor,
          totalBorrowed: userAccountInfo.borrowedUsdc,
          totalDeposited: userAccountInfo.depositedUsdc,
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
