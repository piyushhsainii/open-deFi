import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { FaucetOnboarding } from "@/components/faucet/faucet-onboarding";
import { Suspense } from "react";
import { FaucetFab } from "@/components/faucet/faucet-tab";
import AppProvider from "./Provider";

export const metadata: Metadata = {
  title: "Sol DeFi | Decentralized Lending & Liquidation on Solana",
  description:
    "Sol DeFi is a decentralized lending protocol on Solana that enables users to deposit, borrow, and liquidate assets with speed and efficiency.",
  keywords: [
    "Sol DeFi",
    "Solana DeFi",
    "lending protocol",
    "borrowing crypto",
    "liquidations",
    "crypto lending",
    "DeFi on Solana",
    "Solana lending app",
  ],
  openGraph: {
    title: "Sol DeFi | Decentralized Lending & Liquidation on Solana",
    description:
      "Deposit, borrow, and liquidate assets seamlessly with Sol DeFi — a fast and secure decentralized lending protocol built on Solana.",
    images: [
      {
        url: "https://apneajyhbpncbciasirk.supabase.co/storage/v1/object/public/nft-storage/Screenshot%202025-09-19%20030526.png", // replace with your hosted logo/preview
        width: 1200,
        height: 630,
        alt: "Sol DeFi Protocol Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sol DeFi | Lending & Liquidation Protocol",
    description:
      "Experience fast and efficient decentralized lending and liquidations on Solana with Sol DeFi.",
    images: [
      "https://apneajyhbpncbciasirk.supabase.co/storage/v1/object/public/nft-storage/Screenshot%202025-09-19%20030526.png",
    ], // same as above
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AppProvider>
          <Suspense fallback={null}>
            {children}
            <FaucetOnboarding />
            <FaucetFab />
          </Suspense>
          <Analytics />
        </AppProvider>
      </body>
    </html>
  );
}
