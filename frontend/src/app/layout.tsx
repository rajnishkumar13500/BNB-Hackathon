import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/lib/providers";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ParticleField } from "@/components/ParticleField";
import { ScrollAnimator } from "@/components/ScrollAnimator";
import { CustomCursor } from "@/components/CustomCursor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NFA Passport | Onchain AI Agent Identity",
  description:
    "BAP-578 compliant Non-Fungible Agent protocol. Turn AI agents into tradable, stakeable, reputation-scored economic entities on BNB Chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Web3Provider>
          <ToastProvider>
            <AnimatedBackground />
            <ParticleField />
            <ScrollAnimator />
            <CustomCursor />
            <Navbar />
            <main className="pt-20 min-h-screen relative">{children}</main>
            <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-600">
              NFA Passport v2 — BAP-578 on BNB Chain
            </footer>
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
