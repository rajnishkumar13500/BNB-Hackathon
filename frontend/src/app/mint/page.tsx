"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import Link from "next/link";

export default function MintPage() {
    const [mintedId, setMintedId] = useState<string | null>(null);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleMint = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "mintAgent",
        });
    };

    return (
        <div className="mx-auto max-w-lg px-6 py-16">
            <div className="glass-card p-8 text-center animate-fade-in">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 animate-pulse-glow">
                    <span className="text-4xl">🤖</span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">Mint Your AI Agent</h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Create a BAP-578 compliant Non-Fungible Agent on BNB Chain.
                    Your NFA is a tradable, stakeable identity for your AI.
                </p>

                {!isSuccess ? (
                    <button
                        onClick={handleMint}
                        disabled={isPending || isConfirming}
                        className="btn-primary w-full text-lg py-4"
                    >
                        {isPending
                            ? "Confirm in Wallet..."
                            : isConfirming
                                ? "Minting..."
                                : "Mint Agent (Free)"}
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
                            <p className="text-green-400 font-semibold text-lg">✅ Agent Minted!</p>
                            <p className="text-gray-400 text-sm mt-1">
                                Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
                            </p>
                        </div>
                        <Link
                            href={`/agent/0`}
                            className="btn-primary block w-full text-center"
                        >
                            View Agent Dashboard →
                        </Link>
                    </div>
                )}

                <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                        { label: "Cost", value: "Free" },
                        { label: "Standard", value: "BAP-578" },
                        { label: "Network", value: "BNB" },
                    ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-white/5 p-3">
                            <p className="text-xs text-gray-500">{item.label}</p>
                            <p className="text-sm font-semibold text-white mt-1">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
