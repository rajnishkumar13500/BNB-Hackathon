"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
} from "wagmi";
import { formatEther } from "viem";
import {
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    CATEGORIES,
    TASK_STATUSES,
} from "@/lib/contract";
import { useToast } from "@/components/Toast";

const TASK_BADGE_CLASS: Record<string, string> = {
    Created: "badge-created",
    Submitted: "badge-submitted",
    Validated: "badge-validated",
    Disputed: "badge-disputed",
    Slashed: "badge-slashed",
};

export default function TaskDetailPage() {
    const params = useParams();
    const taskId = BigInt(params.taskId as string);
    const { address } = useAccount();
    const { toast } = useToast();

    // AI Chat state
    const [prompt, setPrompt] = useState("");
    const [aiResult, setAiResult] = useState("");
    const [resultHash, setResultHash] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);

    // Read task
    const { data: task, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "tasks",
        args: [taskId],
    });

    // Read task's agent owner
    const tokenIdFromTask = task ? task[0] : undefined;
    const { data: agentOwner } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "ownerOf",
        args: tokenIdFromTask !== undefined ? [tokenIdFromTask] : undefined,
        query: {
            enabled: tokenIdFromTask !== undefined,
        },
    });

    const { writeContract, data: txHash, isPending, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    if (!task) {
        return (
            <div className="mx-auto max-w-lg px-6 py-16 text-center">
                <div className="glass-card p-8">
                    <p className="text-gray-400">Loading task...</p>
                </div>
            </div>
        );
    }

    const [tokenId, requester, categoryIdx, reward, deadline, onchainHash, statusIdx] = task;
    const status = TASK_STATUSES[Number(statusIdx)] || "Unknown";
    const category = CATEGORIES[Number(categoryIdx)] || "Unknown";
    const deadlineDate = new Date(Number(deadline) * 1000);
    const isExpired = Date.now() > Number(deadline) * 1000;
    const isRequester = address && address.toLowerCase() === requester.toLowerCase();
    const isAgentOwner = address && agentOwner && address.toLowerCase() === (agentOwner as string).toLowerCase();

    // AI Chat: execute prompt
    const handleExecuteAI = async () => {
        if (!prompt.trim()) return;
        setIsExecuting(true);
        setAiResult("");
        setResultHash("");

        try {
            const res = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, category }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setAiResult(data.result);
            setResultHash(data.resultHash);
            toast("AI execution complete!", "success");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "AI execution failed";
            toast(message, "error");
        } finally {
            setIsExecuting(false);
        }
    };

    // Submit the result hash on-chain
    const handleSubmitHash = () => {
        if (!resultHash) return;
        writeContract(
            {
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "submitTaskResult",
                args: [taskId, resultHash as `0x${string}`],
            },
        );
        toast("Submitting result on-chain...", "info");
    };

    const handleValidate = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "validateTask",
            args: [taskId],
        });
        toast("Validating task...", "info");
    };

    const handleDispute = () => {
        if (confirm("Dispute this task? 20% of agent stake will be slashed.")) {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "disputeTask",
                args: [taskId],
            });
            toast("Disputing task...", "info");
        }
    };

    const handleAutoSlash = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "autoSlash",
            args: [taskId],
        });
        toast("Auto-slashing overdue task...", "info");
    };

    return (
        <div className="mx-auto max-w-2xl px-6 py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-white">
                    Task <span className="gradient-text">#{params.taskId}</span>
                </h1>
                <span className={`badge ${TASK_BADGE_CLASS[status] || ""}`}>{status}</span>
            </div>

            {/* Info */}
            <div className="glass-card p-6 mb-6 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500">Agent</p>
                        <p className="text-white font-semibold">#{tokenId.toString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-white font-semibold">{category}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Escrow Reward</p>
                        <p className="text-yellow-400 font-semibold">{formatEther(reward)} BNB</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Deadline</p>
                        <p className={`font-semibold ${isExpired ? "text-red-400" : "text-white"}`}>
                            {deadlineDate.toLocaleString()}
                            {isExpired && " (expired)"}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500">Requester</p>
                        <p className="text-gray-300 text-sm font-mono">{requester}</p>
                    </div>
                    {onchainHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500">Result Hash</p>
                            <p className="text-gray-300 text-xs font-mono break-all">{onchainHash}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Chat — Agent Owner executes AI */}
            {isAgentOwner && status === "Created" && !isExpired && (
                <div className="glass-card p-6 mb-6 animate-fade-in animate-pulse-glow">
                    <h2 className="text-lg font-semibold text-white mb-4">🤖 AI Execution</h2>
                    <p className="text-sm text-gray-400 mb-4">
                        Enter a prompt to execute via AI. The result will be hashed and submitted on-chain.
                    </p>
                    <textarea
                        placeholder={`Enter prompt for ${category} task...`}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        className="input-dark mb-3 resize-none"
                    />
                    {!aiResult ? (
                        <button
                            onClick={handleExecuteAI}
                            disabled={isExecuting || !prompt.trim()}
                            className="btn-primary w-full"
                        >
                            {isExecuting ? "🧠 Running AI..." : "🤖 Execute AI Task"}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-white/5 p-4 max-h-48 overflow-y-auto">
                                <p className="text-xs text-gray-500 mb-1">AI Result:</p>
                                <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                                    {aiResult}
                                </pre>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3">
                                <p className="text-xs text-gray-500">Result Hash:</p>
                                <p className="text-xs text-yellow-400 font-mono break-all">{resultHash}</p>
                            </div>
                            <button
                                onClick={handleSubmitHash}
                                disabled={isPending || isConfirming}
                                className="btn-primary w-full"
                            >
                                {isPending
                                    ? "Confirm in Wallet..."
                                    : isConfirming
                                        ? "Submitting..."
                                        : "📤 Submit Hash On-Chain"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="glass-card p-6 animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
                <div className="flex flex-wrap gap-3">
                    {isRequester && status === "Submitted" && (
                        <button onClick={handleValidate} disabled={isPending || isConfirming} className="btn-primary">
                            {isPending || isConfirming ? "Processing..." : "✅ Validate & Release Reward"}
                        </button>
                    )}
                    {isRequester && (status === "Created" || status === "Submitted") && (
                        <button onClick={handleDispute} disabled={isPending || isConfirming} className="btn-danger">
                            {isPending || isConfirming ? "Processing..." : "⚠️ Dispute (Slash 20%)"}
                        </button>
                    )}
                    {isExpired && (status === "Created" || status === "Submitted") && (
                        <button onClick={handleAutoSlash} disabled={isPending || isConfirming} className="btn-danger">
                            {isPending || isConfirming ? "Processing..." : "⏰ Auto-Slash (Overdue)"}
                        </button>
                    )}
                    {status === "Validated" && <p className="text-green-400 text-sm">Completed — reward released ✅</p>}
                    {status === "Disputed" && <p className="text-orange-400 text-sm">Disputed — 20% stake slashed</p>}
                    {status === "Slashed" && <p className="text-red-400 text-sm">Slashed — deadline expired</p>}
                    {status === "Created" && !isExpired && !isAgentOwner && !isRequester && (
                        <p className="text-gray-500 text-sm">Waiting for agent owner to execute and submit result</p>
                    )}
                </div>
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
