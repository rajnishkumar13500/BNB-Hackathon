"use client";

import Link from "next/link";
import Image from "next/image";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-6 text-center animate-fade-in">
      <p className="text-3xl font-bold gradient-text">{value}</p>
      <p className="mt-2 text-sm text-gray-400">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  const { data: totalAgents } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalAgents",
  });

  const { data: totalTasks } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalTasks",
  });

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="py-24 text-center">
        <div className="flex justify-center mb-8 animate-float">
          <Image src="/logo.png" alt="NFA Passport" width={180} height={180} className="drop-shadow-[0_0_30px_rgba(240,185,11,0.4)]" />
        </div>
        <div className="inline-block mb-6 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-xs font-medium text-yellow-400 animate-scale-in">
          BAP-578 Compliant · BNB Chain Testnet
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="text-white hero-title-line">NFA</span>
          <br />
          <span className="gradient-text glow-text hero-gradient-text">Passport</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed hero-subtitle">
          The first BAP-578 NFA-based smart collateral vault protocol.
          Turn AI agents into programmable collateral, tradable credit assets,
          and reputation-scored economic entities.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/mint" className="btn-primary text-lg px-8 py-3">
            Mint Your Agent
          </Link>
          <Link href="/agents" className="btn-secondary text-lg px-8 py-3">
            Explore Agents
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16 stagger-children">
        <StatCard
          label="Total Agents"
          value={totalAgents?.toString() ?? "—"}
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks?.toString() ?? "—"}
        />
        <StatCard label="Network" value="BNB Testnet" />
      </section>

      {/* Features */}
      <section className="pb-24">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          <FeatureCard
            icon="🤖"
            title="Mint NFA"
            desc="Mint an ERC-721 Non-Fungible Agent. Each NFT represents a unique AI agent identity on-chain."
          />
          <FeatureCard
            icon="💰"
            title="Stake BNB"
            desc="Deposit BNB as collateral into your agent's vault. Stake follows the NFT on transfer."
          />
          <FeatureCard
            icon="⚡"
            title="Execute Tasks"
            desc="Create escrow-funded tasks. AI executes, result is hashed and submitted on-chain."
          />
          <FeatureCard
            icon="⭐"
            title="Build Reputation"
            desc="Validated tasks increase reputation. Failures trigger 20% stake slashing."
          />
        </div>
      </section>
    </div>
  );
}
