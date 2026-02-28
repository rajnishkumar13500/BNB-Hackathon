"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CATEGORIES } from "@/lib/contract";

export default function CreateTaskPage() {
    const params = useParams();
    const router = useRouter();
    const tokenId = BigInt(params.tokenId as string);
    const [category, setCategory] = useState(0);
    const [reward, setReward] = useState("");
    const [hours, setHours] = useState("1");

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleCreate = () => {
        if (!reward) return;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + parseInt(hours) * 3600);
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "createTask",
            args: [tokenId, category, deadline],
            value: parseEther(reward),
        });
    };

    return (
        <div className="mx-auto max-w-lg px-6 py-16">
            <div className="glass-card p-8 animate-fade-in">
                <h1 className="text-2xl font-bold text-white mb-2">
                    Create Task for Agent{" "}
                    <span className="gradient-text">#{params.tokenId}</span>
                </h1>
                <p className="text-gray-400 text-sm mb-8">
                    Escrow BNB as reward. The agent will execute the task via AI.
                </p>

                <div className="space-y-5">
                    {/* Category */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(parseInt(e.target.value))}
                            className="input-dark"
                        >
                            {CATEGORIES.map((cat, idx) => (
                                <option key={cat} value={idx} className="bg-gray-900">
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reward */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Escrow Reward (BNB)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.01"
                            value={reward}
                            onChange={(e) => setReward(e.target.value)}
                            className="input-dark"
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Deadline (hours from now)
                        </label>
                        <input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="input-dark"
                        />
                    </div>

                    {!isSuccess ? (
                        <button
                            onClick={handleCreate}
                            disabled={isPending || isConfirming || !reward}
                            className="btn-primary w-full text-lg py-3"
                        >
                            {isPending
                                ? "Confirm in Wallet..."
                                : isConfirming
                                    ? "Creating Task..."
                                    : `Create Task (${reward || "0"} BNB)`}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                                <p className="text-green-400 font-semibold">✅ Task Created!</p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Tx: {hash?.slice(0, 12)}...{hash?.slice(-8)}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push(`/agent/${params.tokenId}`)}
                                className="btn-secondary w-full"
                            >
                                ← Back to Agent
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
