import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program, BN } from "@coral-xyz/anchor";
import { LendingApp } from "../../../target/types/lending_app";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import IDL from "../../../programs/lending-app/src/build/lending_app.json";
import { SUPPORTED_TOKENS } from "@/lib/data";

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
  depositedSol: string | BN;
  depositedSolShares: string | BN;
  borrowedSol: string | BN;
  borrowedSolShares: string | BN;
  depositedUsdc: string | BN;
  depositedUsdcShares: string | BN;
  borrowedUsdc: string | BN;
  borrowedUsdcShares: string | BN;
  mintAddress: PublicKey;
  healthFactor: string | BN;
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
  const [HealthFactorSol, seHealthFactorSol] = useState(0);
  const [HealthFactorUsdc, setHealthFactorUsdc] = useState(0);
  const [maxSafeWithDrawal, setmaxSafeWithDrawal] = useState({
    usdc: 0,
    sol: 0,
  });
  const [Positions, setPositions] = useState<any>([]);
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

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
          borrowedSol: (
            getAccATA.borrowedSol.toNumber() / 1000000000
          ).toString(),
          borrowedSolShares: (
            getAccATA.borrowedSolShares.toNumber() / 1000000000
          ).toString(),
          borrowedUsdc: (
            getAccATA.borrowedUsdc.toNumber() / 1000000000
          ).toString(),
          borrowedUsdcShares: (
            getAccATA.borrowedUsdcShares.toNumber() / 1000000000
          ).toString(),
          depositedSol: (
            getAccATA.depositedSol.toNumber() / 1000000000
          ).toString(),
          depositedSolShares: (
            getAccATA.depositedSolShares.toNumber() / 1000000000
          ).toString(),
          depositedUsdc: (
            getAccATA.depositedUsdc.toNumber() / 1000000000
          ).toString(),
          depositedUsdcShares: (
            getAccATA.depositedUsdcShares.toNumber() / 1000000000
          ).toString(),
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
      const ActiveDepositSol = Number(
        accountInfo.depositedSol.toNumber() - accountInfo.borrowedSol.toNumber()
      );
      const ActiveDepositUsdc = Number(
        accountInfo.depositedUsdc.toNumber() -
          accountInfo.borrowedUsdc.toNumber()
      );
      const solAvailableToBorrow = Number(
        (ActiveDepositSol * solMaxLtv) / 1000000000
      ).toFixed(2);

      // Calculate USDC available to borrow and health factor
      const usdcAvailableToBorrow = Number(
        (ActiveDepositUsdc * usdcMaxLtv) / 1000000000
      ).toFixed(2);

      const liquidationThreshold = Number(
        solBankInfo.liquidationThreshold.toNumber() / 10000
      );
      const usdcLiquidationThreshold = Number(
        usdcBankInfo.liquidationThreshold.toNumber() / 10000
      );

      const solHealthFactor =
        accountInfo.borrowedUsdc.toNumber() > 0
          ? (
              Number(
                Number(accountInfo.depositedSol.toNumber() / 1000000000) *
                  liquidationThreshold
              ) /
              (accountInfo.borrowedUsdc.toNumber() / 1000000000)
            ).toFixed(2)
          : 100;
      const usdcHealthFactor =
        accountInfo.borrowedSol.toNumber() > 0
          ? (
              Number(
                Number(accountInfo.depositedUsdc.toNumber() / 1000000000) *
                  usdcLiquidationThreshold
              ) /
              (accountInfo.borrowedSol.toNumber() / 1000000000)
            ).toFixed(2)
          : 100;

      setBankBalances({
        tokenA: {
          // SOL
          availableToBorrow: solAvailableToBorrow ?? 0,
          healthFactor: solHealthFactor,
          totalBorrowed: accountInfo.borrowedSol.toNumber(),
          totalDeposited: accountInfo.depositedSol.toNumber(),
        },
        tokenB: {
          // USDC
          availableToBorrow: usdcAvailableToBorrow ?? 0,
          healthFactor: usdcHealthFactor,
          totalBorrowed: accountInfo.borrowedUsdc.toNumber(),
          totalDeposited: accountInfo.depositedUsdc.toNumber(),
        },
      });

      // Calculating Liquidate Section Data

      const users = await program.account.user.all();
      // Collect users with health factor < 1
      const afterBalanceSol = accountInfo.depositedSol.toNumber();
      const afterBalanceUSDC = accountInfo.depositedUsdc.toNumber();
      const MinAmountRequiredSol = (afterBalanceSol * 80) / 100;
      const MinAmountRequiredUsdc = (afterBalanceUSDC * 80) / 100;

      const maxSafeWithDrawalSol =
        accountInfo.depositedSol.toNumber() - MinAmountRequiredSol;
      const maxSafeWithDrawalUsdc =
        accountInfo.depositedSol.toNumber() - MinAmountRequiredUsdc;

      setmaxSafeWithDrawal({
        sol: maxSafeWithDrawalSol,
        usdc: maxSafeWithDrawalUsdc,
      });
      const HealthFactorSol = Number(
        Number(
          MinAmountRequiredSol / accountInfo?.borrowedSol.toNumber()
        ).toFixed(2)
      );
      const HealthFactorUsdc = Number(
        Number(
          MinAmountRequiredUsdc / accountInfo.borrowedUsdc.toNumber()
        ).toFixed(2)
      );
      seHealthFactorSol(HealthFactorSol);
      setHealthFactorUsdc(HealthFactorUsdc);
      // Get all users in liquidation
      const liquidatableUsers = users.filter((dta) => {
        const HealthFactorSol = Number(
          Number(
            MinAmountRequiredSol / accountInfo?.borrowedSol.toNumber()
          ).toFixed(2)
        );

        const HealthFactorUsdc = Number(
          Number(
            MinAmountRequiredUsdc / accountInfo.borrowedUsdc.toNumber()
          ).toFixed(2)
        );
        console.log(`hf sol`, HealthFactorSol);
        console.log(`hf usdc`, HealthFactorUsdc);
        // If either position has HF < 1, mark as liquidatable
        return (
          HealthFactorSol < 1 ||
          HealthFactorUsdc < 1 ||
          !HealthFactorSol ||
          !HealthFactorUsdc
        );
      });

      console.log(liquidatableUsers);
      setPositions(liquidatableUsers);
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
    refetch: () => {
      fetchDashboardData();
    },
    userAccountInfo,
    setuserAccountInfo,
    Positions,
    setPositions,
    HealthFactorSol,
    seHealthFactorSol,
    HealthFactorUsdc,
    setHealthFactorUsdc,
    maxSafeWithDrawal,
    setmaxSafeWithDrawal,
  };
};
