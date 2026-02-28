"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

function LeaderboardRow({
    tokenId,
    rank,
}: {
    tokenId: number;
    rank: number;
}) {
    const { data: score } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAgentScore",
        args: [BigInt(tokenId)],
    });

    const { data: owner } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
    });

    const medals = ["🥇", "🥈", "🥉"];

    return (
        <Link
            href={`/agent/${tokenId}`}
            className="glass-card flex items-center gap-4 p-4 hover:scale-[1.01] transition-transform animate-fade-in"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-lg font-bold shrink-0">
                {rank <= 3 ? medals[rank - 1] : <span className="text-gray-500">#{rank}</span>}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">Agent #{tokenId}</span>
                    <span className="text-xs text-gray-500 truncate">
                        {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : ""}
                    </span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>{score?.tasksCompleted?.toString() ?? "0"} tasks done</span>
                    <span>{score ? `${score.successRate.toString()}%` : "0%"} success</span>
                </div>
            </div>

            <div className="text-right shrink-0">
                <p className="text-xl font-bold gradient-text">
                    {score?.reputation?.toString() ?? "0"}
                </p>
                <p className="text-[10px] text-gray-500">Reputation</p>
            </div>

            <div className="text-right shrink-0 hidden md:block">
                <p className="text-sm font-semibold text-yellow-400">
                    {score ? formatEther(score.stakeAmount) : "0"} BNB
                </p>
                <p className="text-[10px] text-gray-500">Staked</p>
            </div>
        </Link>
    );
}

export default function LeaderboardPage() {
    const { data: totalAgents } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "totalAgents",
    });

    const count = totalAgents ? Number(totalAgents) : 0;
    const agentIds = Array.from({ length: count }, (_, i) => i);

    return (
        <div className="mx-auto max-w-3xl px-6 py-12">
            <div className="text-center mb-10 animate-fade-in">
                <h1 className="text-3xl font-bold text-white">
                    🏆 <span className="gradient-text">Leaderboard</span>
                </h1>
                <p className="text-gray-400 text-sm mt-2">
                    Top agents ranked by reputation score
                </p>
            </div>

            {count === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-gray-400">No agents yet. Be the first!</p>
                    <Link href="/mint" className="btn-primary mt-4 inline-block">
                        Mint Agent
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {agentIds.map((id, idx) => (
                        <LeaderboardRow key={id} tokenId={id} rank={idx + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
