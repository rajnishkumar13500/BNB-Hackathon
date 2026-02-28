"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CATEGORIES } from "@/lib/contract";

function AgentCard({ tokenId }: { tokenId: number }) {
    const { data: score } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAgentScore",
        args: [BigInt(tokenId)],
    });

    const { data: state } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getState",
        args: [BigInt(tokenId)],
    });

    const { data: owner } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
    });

    const statusIdx = state ? Number(state.status) : 0;
    const statusLabel = ["Active", "Paused", "Terminated"][statusIdx] || "Unknown";
    const statusClass =
        statusIdx === 0
            ? "badge-active"
            : statusIdx === 1
                ? "badge-paused"
                : "badge-terminated";

    const totalTasks = score
        ? Number(score.tasksCompleted) + Number(score.tasksFailed)
        : 0;

    return (
        <div className="glass-card p-5 animate-fade-in hover:scale-[1.02] transition-transform">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 text-lg">
                        🤖
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Agent #{tokenId}</h3>
                        <p className="text-xs text-gray-500">
                            {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "—"}
                        </p>
                    </div>
                </div>
                <span className={`badge ${statusClass}`}>{statusLabel}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-sm font-bold text-yellow-400">
                        {score ? formatEther(score.stakeAmount) : "0"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Stake (BNB)</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-sm font-bold text-white">
                        {score?.reputation?.toString() ?? "0"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Reputation</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5 text-center">
                    <p className="text-sm font-bold text-white">
                        {score ? `${score.successRate.toString()}%` : "0%"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Success</p>
                </div>
            </div>

            {/* Tasks info */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>
                    {score?.tasksCompleted?.toString() ?? "0"} completed / {totalTasks} total
                </span>
                <span>
                    {score
                        ? `${formatEther(score.totalValueHandled)} BNB handled`
                        : "0 BNB handled"}
                </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Link
                    href={`/agent/${tokenId}`}
                    className="btn-secondary flex-1 text-center text-sm py-2"
                >
                    View
                </Link>
                {statusIdx === 0 && (
                    <Link
                        href={`/task/create/${tokenId}`}
                        className="btn-primary flex-1 text-center text-sm py-2"
                    >
                        Assign Task
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function AgentsPage() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const { data: totalAgents } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "totalAgents",
    });

    const count = totalAgents ? Number(totalAgents) : 0;
    const agentIds = Array.from({ length: count }, (_, i) => i);

    return (
        <div className="mx-auto max-w-6xl px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Explore <span className="gradient-text">Agents</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Browse {count} agent{count !== 1 ? "s" : ""} on the network — view scores, assign tasks
                    </p>
                </div>
                <Link href="/mint" className="btn-primary whitespace-nowrap">
                    + Mint New Agent
                </Link>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-8 animate-fade-in">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${selectedCategory === null
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                            : "bg-white/5 text-gray-400 border border-white/10 hover:border-yellow-500/30"
                        }`}
                >
                    All
                </button>
                {CATEGORIES.map((cat, idx) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(idx)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${selectedCategory === idx
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                                : "bg-white/5 text-gray-400 border border-white/10 hover:border-yellow-500/30"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Agent Grid */}
            {count === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-4xl mb-4">🤖</p>
                    <p className="text-white text-lg font-semibold">No Agents Yet</p>
                    <p className="text-gray-400 text-sm mt-1 mb-6">
                        Be the first to mint an AI Agent on the network
                    </p>
                    <Link href="/mint" className="btn-primary">
                        Mint Agent
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agentIds.map((id) => (
                        <AgentCard key={id} tokenId={id} />
                    ))}
                </div>
            )}
        </div>
    );
}
