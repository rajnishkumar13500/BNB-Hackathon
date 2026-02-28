"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    AGENT_STATUSES,
    CATEGORIES,
    TASK_STATUSES,
} from "@/lib/contract";
import { useToast } from "@/components/Toast";
import Link from "next/link";

const TASK_BADGE_CLASS: Record<string, string> = {
    Created: "badge-created",
    Submitted: "badge-submitted",
    Validated: "badge-validated",
    Disputed: "badge-disputed",
    Slashed: "badge-slashed",
};

export default function AgentDashboard() {
    const params = useParams();
    const tokenId = BigInt(params.tokenId as string);
    const { address } = useAccount();
    const { toast } = useToast();
    const [stakeAmount, setStakeAmount] = useState("");
    const [transferTo, setTransferTo] = useState("");
    const [showTransfer, setShowTransfer] = useState(false);

    // Read agent score
    const { data: score } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAgentScore",
        args: [tokenId],
    });

    // Read agent state (BAP-578)
    const { data: state } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getState",
        args: [tokenId],
    });

    // Read owner
    const { data: owner } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "ownerOf",
        args: [tokenId],
    });

    // Read total tasks
    const { data: totalTasks } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "totalTasks",
    });

    const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

    const { writeContract, data: txHash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    const handleStake = () => {
        if (!stakeAmount) return;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "stake",
            args: [tokenId],
            value: parseEther(stakeAmount),
        });
        toast("Staking BNB...", "info");
    };

    const handlePause = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "pause",
            args: [tokenId],
        });
        toast("Pausing agent...", "info");
    };

    const handleUnpause = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "unpause",
            args: [tokenId],
        });
        toast("Unpausing agent...", "info");
    };

    const handleTerminate = () => {
        if (confirm("Terminate this agent? This is irreversible. Remaining stake will be returned.")) {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "terminate",
                args: [tokenId],
            });
            toast("Terminating agent...", "info");
        }
    };

    const handleTransfer = () => {
        if (!transferTo || !address) return;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: [
                {
                    name: "transferFrom",
                    type: "function",
                    stateMutability: "nonpayable",
                    inputs: [
                        { name: "from", type: "address" },
                        { name: "to", type: "address" },
                        { name: "tokenId", type: "uint256" },
                    ],
                    outputs: [],
                },
            ] as const,
            functionName: "transferFrom",
            args: [address, transferTo as `0x${string}`, tokenId],
        });
        toast("Transferring agent NFT...", "info");
    };

    const statusIdx = state ? Number(state.status) : 0;
    const statusLabel = AGENT_STATUSES[statusIdx] || "Unknown";
    const statusClass =
        statusIdx === 0 ? "badge-active" : statusIdx === 1 ? "badge-paused" : "badge-terminated";

    return (
        <div className="mx-auto max-w-4xl px-6 py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Agent <span className="gradient-text">#{params.tokenId}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Owner: {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "—"}
                    </p>
                </div>
                <span className={`badge ${statusClass}`}>{statusLabel}</span>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Stake", value: score ? `${formatEther(score.stakeAmount)} BNB` : "—" },
                    { label: "Reputation", value: score?.reputation?.toString() ?? "—" },
                    { label: "Success Rate", value: score ? `${score.successRate.toString()}%` : "—" },
                    {
                        label: "Tasks Done",
                        value: score
                            ? `${score.tasksCompleted.toString()} / ${(score.tasksCompleted + score.tasksFailed).toString()}`
                            : "—",
                    },
                ].map((card) => (
                    <div key={card.label} className="glass-card p-5 animate-fade-in">
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Stake Panel */}
                <div className="glass-card p-6 animate-fade-in">
                    <h2 className="text-lg font-semibold text-white mb-4">💰 Stake BNB</h2>
                    <div className="flex gap-3">
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Amount in BNB"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="input-dark flex-1"
                        />
                        <button
                            onClick={handleStake}
                            disabled={isPending || isConfirming || !isOwner}
                            className="btn-primary whitespace-nowrap"
                        >
                            {isPending ? "Confirm..." : isConfirming ? "Staking..." : "Stake"}
                        </button>
                    </div>
                    {!isOwner && <p className="text-xs text-gray-500 mt-2">Connect as owner to stake</p>}
                </div>

                {/* Controls */}
                <div className="glass-card p-6 animate-fade-in">
                    <h2 className="text-lg font-semibold text-white mb-4">⚙️ Agent Controls</h2>
                    <div className="flex flex-wrap gap-3">
                        {statusIdx === 0 && (
                            <button onClick={handlePause} disabled={!isOwner || isPending} className="btn-secondary">
                                ⏸ Pause
                            </button>
                        )}
                        {statusIdx === 1 && (
                            <button onClick={handleUnpause} disabled={!isOwner || isPending} className="btn-primary">
                                ▶ Unpause
                            </button>
                        )}
                        {statusIdx !== 2 && (
                            <button onClick={handleTerminate} disabled={!isOwner || isPending} className="btn-danger">
                                ⛔ Terminate
                            </button>
                        )}
                        <Link href={`/task/create/${params.tokenId}`} className="btn-primary inline-block">
                            + Create Task
                        </Link>
                        {isOwner && (
                            <button onClick={() => setShowTransfer(!showTransfer)} className="btn-secondary">
                                🔀 Transfer
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Transfer Panel */}
            {showTransfer && isOwner && (
                <div className="glass-card p-6 mb-6 animate-fade-in">
                    <h2 className="text-lg font-semibold text-white mb-2">🔀 Transfer Agent NFT</h2>
                    <p className="text-xs text-gray-400 mb-4">
                        Transfer this agent (including all staked BNB) to another wallet.
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Recipient address (0x...)"
                            value={transferTo}
                            onChange={(e) => setTransferTo(e.target.value)}
                            className="input-dark flex-1"
                        />
                        <button
                            onClick={handleTransfer}
                            disabled={isPending || isConfirming || !transferTo}
                            className="btn-danger whitespace-nowrap"
                        >
                            {isPending ? "Confirm..." : "Transfer"}
                        </button>
                    </div>
                </div>
            )}

            {/* Category Reputation */}
            <div className="glass-card p-6 mb-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">📊 Category Reputation</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat, idx) => (
                        <CategoryRep key={cat} tokenId={tokenId} category={idx} name={cat} />
                    ))}
                </div>
            </div>

            {/* Task History */}
            <div className="glass-card p-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">📋 Task History</h2>
                {totalTasks && Number(totalTasks) > 0 ? (
                    <div className="space-y-2">
                        {Array.from({ length: Number(totalTasks) }, (_, i) => (
                            <TaskHistoryItem key={i} taskId={i} agentTokenId={tokenId} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No tasks yet</p>
                )}
            </div>

            {/* Tx confirmation */}
            {isSuccess && txHash && (
                <div className="mt-6 rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center animate-fade-in">
                    <p className="text-green-400 font-semibold">✅ Transaction confirmed!</p>
                    <a
                        href={`https://testnet.bscscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 text-xs underline mt-1 inline-block"
                    >
                        View on BSCScan →
                    </a>
                </div>
            )}
        </div>
    );
}

function CategoryRep({ tokenId, category, name }: { tokenId: bigint; category: number; name: string }) {
    const { data } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getCategoryReputation",
        args: [tokenId, category],
    });

    return (
        <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs text-gray-500">{name}</p>
            <p className="text-lg font-bold text-white">{data?.toString() ?? "0"}</p>
        </div>
    );
}

function TaskHistoryItem({ taskId, agentTokenId }: { taskId: number; agentTokenId: bigint }) {
    const { data: task } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "tasks",
        args: [BigInt(taskId)],
    });

    if (!task) return null;

    const [tokenId, , categoryIdx, reward, , , statusIdx] = task;

    // Only show tasks for this agent
    if (tokenId !== agentTokenId) return null;

    const status = TASK_STATUSES[Number(statusIdx)] || "Unknown";
    const category = CATEGORIES[Number(categoryIdx)] || "Unknown";

    return (
        <Link
            href={`/task/${taskId}`}
            className="flex items-center justify-between rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors"
        >
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">#{taskId}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400 border border-white/10">
                    {category}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm text-yellow-400">{formatEther(reward)} BNB</span>
                <span className={`badge ${TASK_BADGE_CLASS[status] || ""}`}>{status}</span>
            </div>
        </Link>
    );
}
