"use client";

import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CATEGORIES, TASK_STATUSES } from "@/lib/contract";

const BADGE_CLASS: Record<string, string> = {
    Created: "badge-created",
    Submitted: "badge-submitted",
    Validated: "badge-validated",
    Disputed: "badge-disputed",
    Slashed: "badge-slashed",
};

function TaskRow({ taskId }: { taskId: number }) {
    const { data: task } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "tasks",
        args: [BigInt(taskId)],
    });

    if (!task) return null;

    const [tokenId, requester, categoryIdx, reward, deadline, , statusIdx] = task;
    const status = TASK_STATUSES[Number(statusIdx)] || "Unknown";
    const category = CATEGORIES[Number(categoryIdx)] || "Unknown";
    const isExpired = Date.now() > Number(deadline) * 1000;

    return (
        <Link
            href={`/task/${taskId}`}
            className="glass-card flex items-center gap-4 p-4 hover:scale-[1.01] transition-transform animate-fade-in"
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-gray-400 shrink-0">
                #{taskId}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">Agent #{tokenId.toString()}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400 border border-white/10">
                        {category}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                    By {requester.slice(0, 8)}...{requester.slice(-6)}
                    {isExpired && status !== "Validated" && status !== "Disputed" && status !== "Slashed" && (
                        <span className="text-red-400 ml-2">⏰ expired</span>
                    )}
                </p>
            </div>

            <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-yellow-400">
                    {formatEther(reward)} BNB
                </p>
            </div>

            <span className={`badge ${BADGE_CLASS[status] || ""} shrink-0`}>{status}</span>
        </Link>
    );
}

export default function TasksPage() {
    const { data: totalTasks } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "totalTasks",
    });

    const count = totalTasks ? Number(totalTasks) : 0;
    const taskIds = Array.from({ length: count }, (_, i) => i).reverse();

    return (
        <div className="mx-auto max-w-3xl px-6 py-12">
            <div className="flex items-center justify-between mb-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        📋 <span className="gradient-text">Task Explorer</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {count} task{count !== 1 ? "s" : ""} on the network
                    </p>
                </div>
            </div>

            {count === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-gray-400">No tasks yet. Create one from an agent page!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {taskIds.map((id) => (
                        <TaskRow key={id} taskId={id} />
                    ))}
                </div>
            )}
        </div>
    );
}
