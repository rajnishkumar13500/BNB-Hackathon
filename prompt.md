🧠 MASTER BUILD PROMPT FOR GOOGLE ANTIGRAVITY

You are a senior Web3 protocol engineer.

You are helping build a BNB Chain Bengaluru Hackathon project.

Before generating any code, fully understand the architecture, goals, constraints, and references below.

Do not overengineer.
Keep MVP clean, secure, and production-grade.

🚀 Project Name

NFA Agent Passport v2

🎯 Objective

Build a BAP-578 compliant Non-Fungible Agent (NFA) protocol that:

Turns AI agents into tradable ERC-721-based NFAs

Embeds BNB staking inside each NFA (collateral vault model)

Enables escrow-funded AI task execution

Implements slashing for failure

Tracks onchain reputation (global + per category)

Makes high-reputation NFAs valuable credit assets

This directly targets:

Smart Collateral for Web3 Credit & BNPL track

📚 REQUIRED DOCUMENTATION REFERENCES

You MUST strictly reference and follow:

1️⃣ BAP-578 Specification

https://github.com/bnb-chain/BEPs/blob/master/BAPs/BAP-578.md

Understand:

Required interface compliance

ERC-721 extension logic

Agent identity design

Transfer compatibility requirements

2️⃣ OpenZeppelin Contracts

https://docs.openzeppelin.com/contracts

Use:

ERC721

ReentrancyGuard

Ownable (only if absolutely required)

SafeMath not required for Solidity 0.8+

3️⃣ BNB Chain Testnet

https://docs.bnbchain.org/docs/testnet/

Deploy to:

BNB Chain Testnet

Use Hardhat

4️⃣ Hardhat

https://hardhat.org/docs

5️⃣ wagmi + viem

https://wagmi.sh/

https://viem.sh/

6️⃣ OpenAI API

https://platform.openai.com/docs

🏗️ Tech Stack (MANDATORY)
Blockchain

Solidity 0.8.x

Hardhat

OpenZeppelin

Network

BNB Chain Testnet

Frontend

Next.js 14 (App Router)

TypeScript

wagmi

viem

TailwindCSS

Backend

Next.js API Routes

OpenAI SDK

ethers.js for hashing

Deployment

Vercel (frontend)

Hardhat scripts for contract

🧠 Core Architecture

Each NFA (ERC-721 tokenId) represents one AI agent.

For each tokenId, store:

stake (BNB)

reputation

tasksCompleted

tasksFailed

totalValueHandled

mapping(category => reputation)

active flag

Stake must be:

Deposited into contract

Mapped to tokenId

Move with NFT ownership

Slashable

🧱 Smart Contract Requirements
Contract Name:

NFAAgentPassport.sol

Must:

Extend ERC721

Follow BAP-578 interface

Use ReentrancyGuard

Be fully transferable

Preserve stake and reputation on transfer

Core Functions
1️⃣ mintAgent()

Mint new NFA

2️⃣ stake(uint256 tokenId)

Payable
Adds BNB to that NFA’s stake

3️⃣ createTask(uint256 tokenId, Category category, uint256 deadline)

Payable
Escrow reward

4️⃣ submitTaskResult(uint256 taskId, bytes32 resultHash)
5️⃣ validateTask(uint256 taskId)
6️⃣ disputeTask(uint256 taskId)
7️⃣ autoSlash(uint256 taskId)
8️⃣ getAgentScore(uint256 tokenId)

Return:

stake

reputation

successRate

categoryReputation

🔁 Task Lifecycle

User creates escrow task.

Assigned to NFA tokenId.

Backend executes AI.

Result hashed.

Hash submitted.

Validate → reward + reputation increase.

Dispute/timeout → slash 20% stake.

🧮 Reputation Logic

Reputation increases:

reputation += reward / 1e15

Category reputation increases separately.

On slash:

reputation -= penaltyWeight
stake -= slashAmount

Success rate:

tasksCompleted * 100 / (tasksCompleted + tasksFailed)

🔒 Security Constraints

Use Checks-Effects-Interactions

Prevent double validation

Prevent double slashing

Validate deadlines

Prevent underflow

Ensure NFT transfer does not break stake mapping

Ensure reentrancy protection on fund transfers

🚫 Out of Scope

Do NOT implement:

ERC-20 token

DAO

Governance

Cross-chain

ZK

Complex arbitration

Marketplace UI

Keep hackathon-focused.

📂 Required Folder Structure

root/

contracts/

scripts/

frontend/

README.md

hardhat.config.js

.env.example

📘 README Requirements

Include:

Problem Statement

Architecture Diagram (Mermaid)

BAP-578 compliance explanation

Economic design

Deployment steps

Demo flow

Security considerations

🛠️ Development Phases

Proceed step-by-step:

Phase 1:
Design full contract architecture (no code yet)

Phase 2:
Implement staking + slashing

Phase 3:
Implement task lifecycle

Phase 4:
Implement reputation logic

Phase 5:
Implement frontend mint + stake

Phase 6:
Implement backend AI execution

Do not jump ahead.

🎯 Final Positioning

This is:

“The first BAP-578 NFA-based smart collateral vault protocol for autonomous AI agents on BNB Chain.”

It turns AI agents into:

Programmable collateral

Tradable credit assets

Reputation-scored economic entities

Before generating any code:

Confirm full understanding of BAP-578

Explain how stake binds to tokenId

Explain how NFT transfer preserves economic state

Outline contract storage layout

Identify potential edge cases

Only after confirmation proceed to implementation.

END OF PROMPT