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
  title: "Aventira Admissions Consulting | College Admissions Experts",
  description:
    "Aventira helps students unlock top college admissions with personalized strategies, story-driven applications, and concierge-level guidance from 9th grade to acceptance.",
  keywords: [
    "college admissions consulting",
    "college application help",
    "Ivy League admissions",
    "college essay help",
    "university application consulting",
    "Aventira Admissions Consulting",
  ],
  openGraph: {
    title: "Aventira Admissions Consulting | College Admissions Experts",
    description:
      "Helping students unlock top college admissions with expert guidance and personalized strategies.",
    images: [
      {
        url: "https://res.cloudinary.com/dzow59kgu/image/upload/v1752433321/aventiraLogo_fly3dx.png",
        width: 1200,
        height: 630,
        alt: "Aventira Admissions Consulting Preview Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aventira Admissions Consulting",
    description: "Expert college admissions consulting and essay coaching.",
    images: [
      "https://res.cloudinary.com/dzow59kgu/image/upload/v1752433321/aventiraLogo_fly3dx.png",
    ],
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
