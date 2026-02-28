export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const CONTRACT_ABI = [
    // Mint
    {
        name: "mintAgent",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    // Stake
    {
        name: "stake",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
    },
    // Create Task
    {
        name: "createTask",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "tokenId", type: "uint256" },
            { name: "category", type: "uint8" },
            { name: "deadline", type: "uint256" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    // Submit Task Result
    {
        name: "submitTaskResult",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "taskId", type: "uint256" },
            { name: "resultHash", type: "bytes32" },
        ],
        outputs: [],
    },
    // Validate Task
    {
        name: "validateTask",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "taskId", type: "uint256" }],
        outputs: [],
    },
    // Dispute Task
    {
        name: "disputeTask",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "taskId", type: "uint256" }],
        outputs: [],
    },
    // Auto Slash
    {
        name: "autoSlash",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "taskId", type: "uint256" }],
        outputs: [],
    },
    // Fund Agent (BAP-578)
    {
        name: "fundAgent",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
    },
    // Pause
    {
        name: "pause",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
    },
    // Unpause
    {
        name: "unpause",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
    },
    // Terminate
    {
        name: "terminate",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
    },
    // View: getAgentScore
    {
        name: "getAgentScore",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [
            {
                name: "score",
                type: "tuple",
                components: [
                    { name: "stakeAmount", type: "uint256" },
                    { name: "reputation", type: "uint256" },
                    { name: "successRate", type: "uint256" },
                    { name: "tasksCompleted", type: "uint256" },
                    { name: "tasksFailed", type: "uint256" },
                    { name: "totalValueHandled", type: "uint256" },
                ],
            },
        ],
    },
    // View: getState (BAP-578)
    {
        name: "getState",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "balance", type: "uint256" },
                    { name: "status", type: "uint8" },
                    { name: "owner", type: "address" },
                    { name: "logicAddress", type: "address" },
                    { name: "lastActionTimestamp", type: "uint256" },
                ],
            },
        ],
    },
    // View: tasks
    {
        name: "tasks",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "uint256" }],
        outputs: [
            { name: "tokenId", type: "uint256" },
            { name: "requester", type: "address" },
            { name: "category", type: "uint8" },
            { name: "reward", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "resultHash", type: "bytes32" },
            { name: "status", type: "uint8" },
        ],
    },
    // View: totalAgents
    {
        name: "totalAgents",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    // View: totalTasks
    {
        name: "totalTasks",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    // View: ownerOf
    {
        name: "ownerOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
    },
    // View: getCategoryReputation
    {
        name: "getCategoryReputation",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "tokenId", type: "uint256" },
            { name: "category", type: "uint8" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    // Events
    {
        name: "AgentMinted",
        type: "event",
        inputs: [
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "owner", type: "address", indexed: true },
        ],
    },
    {
        name: "TaskCreated",
        type: "event",
        inputs: [
            { name: "taskId", type: "uint256", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "category", type: "uint8", indexed: false },
            { name: "reward", type: "uint256", indexed: false },
            { name: "deadline", type: "uint256", indexed: false },
        ],
    },
] as const;

export const CATEGORIES = [
    "General",
    "Coding",
    "Writing",
    "Analysis",
    "Creative",
    "Research",
] as const;

export const TASK_STATUSES = [
    "Created",
    "Submitted",
    "Validated",
    "Disputed",
    "Slashed",
] as const;

export const AGENT_STATUSES = ["Active", "Paused", "Terminated"] as const;
