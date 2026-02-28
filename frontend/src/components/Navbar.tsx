"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2 nav-brand">
                    <div className="nav-logo-box flex items-center justify-center rounded-lg">
                        <Image src="/logo.png" alt="NFA Passport" width={72} height={72} className="drop-shadow-lg" />
                    </div>
                    <span className="text-lg font-bold text-white">
                        <span className="nav-brand-nfa transition-all duration-300">NFA </span><span className="text-yellow-400 nav-brand-passport transition-all duration-300">Passport</span>
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <Link href="/agents" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                        Explore
                    </Link>
                    <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                        Leaderboard
                    </Link>
                    <Link href="/tasks" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                        Tasks
                    </Link>
                    <Link href="/mint" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                        Mint
                    </Link>
                </div>

                <ConnectButton.Custom>
                    {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        mounted,
                    }) => {
                        const connected = mounted && account && chain;
                        return (
                            <div
                                {...(!mounted && {
                                    "aria-hidden": true,
                                    style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                                })}
                            >
                                {!connected ? (
                                    <button
                                        onClick={openConnectModal}
                                        className="rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-2.5 text-sm font-semibold text-black hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/20"
                                    >
                                        Connect Wallet
                                    </button>
                                ) : chain.unsupported ? (
                                    <button
                                        onClick={openChainModal}
                                        className="rounded-xl bg-red-500/20 border border-red-500/50 px-5 py-2.5 text-sm font-semibold text-red-400"
                                    >
                                        Wrong Network
                                    </button>
                                ) : (
                                    <button
                                        onClick={openAccountModal}
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                                    >
                                        {account.displayName}
                                    </button>
                                )}
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
            </div>
        </nav>
    );
}
