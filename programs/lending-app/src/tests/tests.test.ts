import { BN, Program } from "@coral-xyz/anchor";
import assert from "assert";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import IDL from "./lending_app.json";
import { LendingApp } from "./lending_app";
import { BankrunContextWrapper } from "./bankrunContextWrapper";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { createMint, mintTo } from "spl-token-bankrun";
import { createAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { it } from "mocha";

describe("Lending tests", async () => {
  // Fetching pyth account info.

  const connection = new Connection(clusterApiUrl("devnet"), {
    commitment: "confirmed",
  });
  //  solana pyth key
  const pyth = new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE");
  const accountinfo = await connection.getAccountInfo(pyth);
  if (!accountinfo) return;

  //   Setup Bank Run Provider
  const context = await startAnchor(
    // path
    "",
    // programs
    [
      {
        name: "lending_app",
        programId: new PublicKey(IDL.address),
      },
    ],
    // Accounts
    [
      {
        info: accountinfo,
        address: pyth,
      },
    ]
  );

  const provider = new BankrunProvider(context);
  const ctx = new BankrunContextWrapper(context);

  ctx.connection.toConnection();
  // setting up solana pyth receiver
  const pythSolanaReceiver = new PythSolanaReceiver({
    connection: connection,
    wallet: provider.wallet,
  });
  const SOL_FEED_ID =
    "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
  const USDC_FEED_ID =
    "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";
  const solFeedAddress = pythSolanaReceiver.getPriceFeedAccountAddress(
    0,
    SOL_FEED_ID
  );
  const UsdcFeedAddress = pythSolanaReceiver.getPriceFeedAccountAddress(
    0,
    USDC_FEED_ID
  );
  //

  let banksClient = context.banksClient;
  let payer = provider.wallet.payer;

  let program: Program<LendingApp> = new Program(IDL, provider);

  const mintSol = await createMint(
    banksClient,
    payer,
    payer.publicKey,
    null,
    8
  );
  const mintUsdc = await createMint(
    banksClient,
    payer,
    payer.publicKey,
    null,
    8
  );

  const [usdcBankAccount] = PublicKey.findProgramAddressSync(
    [],
    program.programId
  );
  const [solBankAccount] = PublicKey.findProgramAddressSync(
    [],
    program.programId
  );

  // initializing the user for usdc
  const user_usdc_account = program.methods.initUser().accounts({
    signer: payer.publicKey,
    mintAddress: mintUsdc,
    tokenProgram: TOKEN_PROGRAM_ID,
  });
  // initializing the user for sol
  const user_sol_account = program.methods.initUser().accounts({
    signer: payer.publicKey,
    mintAddress: mintSol,
    tokenProgram: TOKEN_PROGRAM_ID,
  });
  const amount = 10_000 * 10 ** 9;

  it("Test Init and Fund Sol Account", async () => {
    // initializing the SOL bank
    program.methods
      .initBank(
        new BN(7500), // max LTV
        new PublicKey(solBankAccount),
        new BN(8500), // max Liquidation Threshold         //85%
        new BN(500), //5%
        new BN(5000), //50%
        new BN(500) //5%
      )
      .accounts({
        signer: payer.publicKey,
        tokenMintAddress: mintSol,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    // Funding the Bank
    await mintTo(
      banksClient,
      payer,
      mintSol,
      user_sol_account,
      solBankAccount,
      amount
    );
    console.log("Initialized the Sol Bank and Funded it!");
  });

  it("Test Init and Fund Usdc Account", async () => {
    // initializing the USDC bank
    program.methods
      .initBank(
        new BN(7500), // max LTV
        new PublicKey(usdcBankAccount),
        new BN(8500), // max Liquidation Threshold         //85%
        new BN(500), //5%
        new BN(5000), //50%
        new BN(500) //5%
      )
      .accounts({
        signer: payer.publicKey,
        tokenMintAddress: mintUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    // Funding the Bank
    await mintTo(
      banksClient,
      payer,
      mintUsdc,
      user_usdc_account,
      usdcBankAccount,
      amount
    );
    console.log("Initialized the USDC Bank and Funded it!");
  });

  it("Creating User Sol Token Account and Funding it", async () => {
    const user_sol_account = await createAccount(
      connection,
      payer,
      mintSol,
      payer.publicKey
    );
    console.log(`${user_sol_account.toString()} User Sol Token`);
  });

  it("Creating User USDC Token Account and Funding it", async () => {
    const user_usdc_account = await createAccount(
      connection,
      payer,
      mintUsdc,
      payer.publicKey
    );
    console.log(`${user_usdc_account.toString()} User USDC Token`);
  });

  it("Testing Deposit Instruction for USDC", async () => {
    const deposit = program.methods.deposit(new BN(10000)).accounts({
      tokenMintAddress: mintUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
      signer: payer.publicKey,
    });
  });

  it("Testing Deposit Instruction for SOL", async () => {
    const deposit = program.methods.deposit(new BN(10000)).accounts({
      tokenMintAddress: mintSol,
      tokenProgram: TOKEN_PROGRAM_ID,
      signer: payer.publicKey,
    });
  });
});
