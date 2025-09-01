import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import AppProvider from "./Provider";
import "@solana/wallet-adapter-react-ui/styles.css";
export const metadata: Metadata = {
  title: "SolMint - Mint Your Own NFT on Solana Instantly",
  description:
    "Create, mint, and trade NFTs on the fastest blockchain. No coding required, just pure creativity.",
  keywords: ["Mint Your Own NFT", "Solana", "NFT", "create NFT", "blockchain"],
  authors: [{ name: "Piyush saini" }],
  creator: "Piyush Saini",
  publisher: "Piyush Saini",
  robots: "index, follow",
  openGraph: {
    title: "SolMint - Mint Your Own NFT on Solana Instantly",
    description:
      "Create, mint, and trade NFTs on the fastest blockchain. No coding required, just pure creativity.",
    type: "website",
    images: [
      {
        url: "https://apneajyhbpncbciasirk.supabase.co/storage/v1/object/public/nft-storage/solmint-landingpage.png",
        width: 1200,
        height: 630,
        alt: "Liquid ETH",
      },
    ],
    siteName: "VoiceAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "SolMint - Mint Your Own NFT on Solana Instantly",
    description:
      "Create, mint, and trade NFTs on the fastest blockchain. No coding required, just pure creativity.",
    images: [
      "https://apneajyhbpncbciasirk.supabase.co/storage/v1/object/public/nft-storage/solmint-landingpage.png",
    ],
    creator: "Piyush Saini",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3B82F6",
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
          {children}
          <Analytics />
        </AppProvider>
      </body>
    </html>
  );
}
