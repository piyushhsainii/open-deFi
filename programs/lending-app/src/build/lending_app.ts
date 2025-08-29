/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/lending_app.json`.
 */
export type LendingApp = {
  "address": "7jRGvMHAFJTRU9mt3BbY82xTaDgugWWzRV1WUqbqVprM",
  "metadata": {
    "name": "lendingApp",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bank",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  110,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "tokenMintAddress"
              }
            ]
          }
        },
        {
          "name": "tokenBankAcc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tokenMintAddress"
              }
            ]
          }
        },
        {
          "name": "userLendingProgramAcc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "tokenMintAddress"
              }
            ]
          }
        },
        {
          "name": "tokenMintAddress"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initBank",
      "discriminator": [
        73,
        111,
        27,
        243,
        202,
        129,
        159,
        80
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bank",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  110,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "tokenMintAddress"
              }
            ]
          }
        },
        {
          "name": "tokenBankAcc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tokenMintAddress"
              }
            ]
          }
        },
        {
          "name": "tokenMintAddress"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "maxLtv",
          "type": "u64"
        },
        {
          "name": "mintAddress",
          "type": "pubkey"
        },
        {
          "name": "liquidationThreshold",
          "type": "u64"
        },
        {
          "name": "liquidationBonus",
          "type": "u64"
        },
        {
          "name": "closeFactor",
          "type": "u64"
        },
        {
          "name": "interestRate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initUser",
      "discriminator": [
        14,
        51,
        68,
        159,
        237,
        78,
        158,
        102
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "mintAddress"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "bank",
      "discriminator": [
        142,
        49,
        166,
        242,
        50,
        66,
        97,
        188
      ]
    },
    {
      "name": "user",
      "discriminator": [
        159,
        117,
        95,
        227,
        239,
        151,
        58,
        236
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "customError",
      "msg": "Custom error message"
    },
    {
      "code": 6001,
      "name": "mathError",
      "msg": "Underflow, Overflow error"
    },
    {
      "code": 6002,
      "name": "overBorrow",
      "msg": "Cannot Overborrow"
    },
    {
      "code": 6003,
      "name": "mathOverflow",
      "msg": "Variable Overflowed!"
    },
    {
      "code": 6004,
      "name": "accountIsHealthy",
      "msg": "Account is not healthy!"
    }
  ],
  "types": [
    {
      "name": "bank",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mintAddress",
            "type": "pubkey"
          },
          {
            "name": "totalDeposits",
            "type": "u64"
          },
          {
            "name": "totalDepositShares",
            "type": "u64"
          },
          {
            "name": "totalBorrowed",
            "type": "u64"
          },
          {
            "name": "totalBorrowedShares",
            "type": "u64"
          },
          {
            "name": "liquidationThreshold",
            "type": "u64"
          },
          {
            "name": "liquidationBonus",
            "type": "u64"
          },
          {
            "name": "closeFactor",
            "type": "u64"
          },
          {
            "name": "maxLtv",
            "type": "u64"
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "user",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "depositedSol",
            "type": "u64"
          },
          {
            "name": "depositedSolShares",
            "type": "u64"
          },
          {
            "name": "borrowedSol",
            "type": "u64"
          },
          {
            "name": "borrowedSolShares",
            "type": "u64"
          },
          {
            "name": "depositedUsdc",
            "type": "u64"
          },
          {
            "name": "depositedUsdcShares",
            "type": "u64"
          },
          {
            "name": "borrowedUsdc",
            "type": "u64"
          },
          {
            "name": "borrowedUsdcShares",
            "type": "u64"
          },
          {
            "name": "mintAddress",
            "type": "pubkey"
          },
          {
            "name": "healthFactor",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "maxAge",
      "type": "u64",
      "value": "100"
    },
    {
      "name": "seed",
      "type": "string",
      "value": "\"anchor\""
    },
    {
      "name": "solUsdFeedId",
      "type": "string",
      "value": "\"ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d\""
    },
    {
      "name": "usdcUsdFeedId",
      "type": "string",
      "value": "\"eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a\""
    }
  ]
};
