/**
 * AI Task Execution Backend (Groq API)
 * 
 * Standalone script that:
 * 1. Takes a prompt and task category
 * 2. Calls Groq API (llama-3.3-70b-versatile) to execute the AI task
 * 3. Hashes the result with keccak256
 * 4. Optionally submits the hash on-chain
 * 
 * Usage:
 *   node backend/execute-task.js --prompt "Write a summary" --taskId 0
 *   node backend/execute-task.js --prompt "Analyze data" --taskId 1 --submit
 */

require("dotenv").config();
const { ethers } = require("ethers");
const Groq = require("groq-sdk");

// ─── Config ──────────────────────────────────────────────────────────

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";

const CONTRACT_ABI = [
    "function submitTaskResult(uint256 taskId, bytes32 resultHash) external",
    "function tasks(uint256) view returns (uint256 tokenId, address requester, uint8 category, uint256 reward, uint256 deadline, bytes32 resultHash, uint8 status)",
];

// ─── AI Execution ────────────────────────────────────────────────────

async function executeAITask(prompt, category) {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not set in .env — get one at https://console.groq.com/keys");
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const systemPrompts = {
        General: "You are a helpful AI assistant.",
        Coding: "You are an expert programmer. Provide clean, working code.",
        Writing: "You are a professional writer. Produce clear, engaging content.",
        Analysis: "You are a data analyst. Provide thorough, insightful analysis.",
        Creative: "You are a creative AI. Generate imaginative, original content.",
        Research: "You are a research assistant. Provide well-sourced, accurate information.",
    };

    const systemPrompt = systemPrompts[category] || systemPrompts.General;

    console.log(`\n🤖 Executing AI task (${category}) via Groq...`);
    console.log(`📝 Prompt: "${prompt}"\n`);

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
        ],
        max_tokens: 1000,
    });

    const result = completion.choices[0].message.content;
    console.log("✅ AI Result:\n", result, "\n");

    return result;
}

// ─── Hash Result ─────────────────────────────────────────────────────

function hashResult(result) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(result));
    console.log("🔒 Result Hash:", hash);
    return hash;
}

// ─── Submit On-Chain ─────────────────────────────────────────────────

async function submitOnChain(taskId, resultHash) {
    if (!DEPLOYER_PRIVATE_KEY || !CONTRACT_ADDRESS) {
        throw new Error("DEPLOYER_PRIVATE_KEY and CONTRACT_ADDRESS must be set in .env");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log(`\n📤 Submitting result hash on-chain for task ${taskId}...`);
    const tx = await contract.submitTaskResult(taskId, resultHash);
    console.log("⏳ Tx hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Confirmed in block:", receipt.blockNumber);

    return receipt;
}

// ─── CLI Entry Point ─────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const argMap = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--")) {
            const key = args[i].replace("--", "");
            // Check if next arg exists and is NOT another flag
            if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
                argMap[key] = args[i + 1];
                i++;
            } else {
                argMap[key] = true;
            }
        }
    }

    const prompt = argMap.prompt;
    const taskId = argMap.taskId;
    const category = argMap.category || "General";
    const shouldSubmit = argMap.submit !== undefined;

    if (!prompt) {
        console.log("Usage: node backend/execute-task.js --prompt \"Your prompt\" --taskId 0 [--category Coding] [--submit]");
        console.log("\nCategories: General, Coding, Writing, Analysis, Creative, Research");
        process.exit(1);
    }

    // Execute AI
    const result = await executeAITask(prompt, category);

    // Hash
    const resultHash = hashResult(result);

    // Submit on-chain if requested
    if (shouldSubmit) {
        if (taskId === undefined) {
            console.error("❌ --taskId required when using --submit");
            process.exit(1);
        }
        await submitOnChain(taskId, resultHash);
    }

    console.log("\n📊 Summary:");
    console.log("  Result length:", result.length, "chars");
    console.log("  Result hash:", resultHash);
    if (taskId !== undefined) console.log("  Task ID:", taskId);
    if (shouldSubmit) console.log("  ✅ Submitted on-chain");
    else console.log("  ℹ️  Use --submit to submit on-chain");
}

main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
