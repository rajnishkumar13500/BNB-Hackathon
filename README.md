<p align="center">
  <img src="assets/logo.png" alt="NFA Passport Logo" width="160" />
</p>

<h1 align="center">NFA Passport</h1>

<p align="center">
  <strong>Onchain Identity & Smart Collateral for AI Agents on BNB Chain</strong>
</p>

<p align="center">
  <a href="https://github.com/bnb-chain/BEPs/blob/master/BAPs/BAP-578.md">
    <img src="https://img.shields.io/badge/BAP--578-Compliant-F0B90B?style=for-the-badge" alt="BAP-578" />
  </a>
  <img src="https://img.shields.io/badge/BNB_Chain-Testnet-F0B90B?style=for-the-badge&logo=binance" alt="BNB Testnet" />
  <img src="https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

---

## 🎯 Problem Statement

AI agents are everywhere — writing code, analyzing data, managing workflows — yet they have **no verifiable identity, economic stake, or portable reputation** in the Web3 ecosystem.

| Pain Point | Consequence |
|---|---|
| **No on-chain identity** | You can't tell if an agent is trustworthy or a scam |
| **No skin in the game** | Agents can fail tasks with zero consequences |
| **No portable reputation** | Every platform starts from scratch — no credit history |
| **No composability** | Agents can't be traded, collateralized, or used in DeFi |

---

## 💡 Solution — NFA Passport

NFA Passport turns AI agents into **tradable, stakeable, reputation-scored economic entities** using the [BAP-578](https://github.com/bnb-chain/BEPs/blob/master/BAPs/BAP-578.md) Non-Fungible Agent standard on BNB Chain.

Each NFA is an **ERC-721 NFT** that bundles:

- 🆔 **Unique AI Agent Identity** — one token = one agent, transferable
- 💰 **Collateral Vault** — BNB staked directly into the agent, moves with the NFT
- ⚡ **Escrow Task Engine** — requesters lock payment, agents execute AI tasks, results are hashed on-chain
- ⭐ **Onchain Reputation** — global + per-category scores, built through successful task completion
- 🔪 **Slashing Mechanism** — 20% stake slashed for failed/disputed tasks, creating real accountability

> **One-liner:** *"The first BAP-578 NFA-based smart collateral vault protocol for autonomous AI agents on BNB Chain."*

---

## 🧑‍💻 User Journey

```mermaid
flowchart TD
    A["🔗 Connect Wallet<br/>(MetaMask / WalletConnect)"] --> B["🤖 Mint NFA Agent<br/>(ERC-721 NFT)"]
    B --> C["💰 Stake BNB<br/>(Collateral Vault)"]
    C --> D{"Choose Action"}
    
    D -->|Request work| E["📋 Create Task<br/>(Escrow reward + deadline)"]
    D -->|View portfolio| F["📊 Agent Dashboard<br/>(Stats, reputation, tasks)"]
    D -->|Compare agents| G["🏆 Leaderboard<br/>(Rank by reputation)"]
    
    E --> H["🤖 AI Executes Task<br/>(Groq LLM via backend)"]
    H --> I["🔒 Result Hash<br/>Submitted On-Chain"]
    I --> J{"Outcome"}
    
    J -->|"✅ Validated"| K["💸 Reward Released<br/>+ Reputation ↑"]
    J -->|"❌ Disputed"| L["🔪 20% Stake Slashed<br/>+ Reputation ↓"]
    J -->|"⏰ Timed Out"| M["⚠️ Auto-Slash<br/>+ Escrow Refunded"]
    
    K --> N["⭐ High-Reputation Agent<br/>= Valuable Credit Asset"]
    L --> N
    M --> N
    N --> O["🔄 Trade / Transfer NFA<br/>(Stake + reputation follow)"]
    
    style A fill:#1a1a2e,stroke:#F0B90B,color:#fff
    style B fill:#1a1a2e,stroke:#F0B90B,color:#fff
    style C fill:#1a1a2e,stroke:#F0B90B,color:#fff
    style K fill:#0d3320,stroke:#10b981,color:#fff
    style L fill:#3b1010,stroke:#ef4444,color:#fff
    style M fill:#3b2a10,stroke:#f59e0b,color:#fff
    style N fill:#1a1a2e,stroke:#F0B90B,color:#fff
    style O fill:#1a1a2e,stroke:#F0B90B,color:#fff
```

---

## 🔧 System Architecture Diagram

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        Browser["Browser"]
        MetaMask["MetaMask Wallet"]
    end

    subgraph Frontend["⚛️ Frontend (Next.js 16)"]
        Pages["Pages<br/>Home | Mint | Agents | Tasks | Leaderboard"]
        Wagmi["wagmi + viem<br/>(Contract Hooks)"]
        RainbowKit["RainbowKit<br/>(Wallet Connection)"]
        API["API Route<br/>/api/execute-task"]
    end

    subgraph Backend["🤖 AI Backend"]
        Groq["Groq SDK<br/>(Llama 3.3 70B)"]
        Hasher["ethers.js<br/>(keccak256 Hashing)"]
    end

    subgraph Blockchain["⛓️ BNB Chain (Testnet)"]
        Contract["NFAAgentPassport.sol<br/>(ERC-721 + BAP-578)"]
        subgraph ContractModules["Contract Modules"]
            Staking["Staking Vault"]
            TaskEngine["Escrow Task Engine"]
            Reputation["Reputation Engine"]
            Slashing["Slashing Module"]
        end
    end

    Browser --> Pages
    Browser --> MetaMask
    MetaMask --> RainbowKit
    RainbowKit --> Wagmi
    Pages --> Wagmi
    Pages --> API
    Wagmi -->|"Read/Write txns"| Contract
    API --> Groq
    Groq -->|"AI Result"| Hasher
    Hasher -->|"resultHash"| Contract
    Contract --> Staking
    Contract --> TaskEngine
    Contract --> Reputation
    Contract --> Slashing

    style Client fill:#0d1117,stroke:#30363d,color:#fff
    style Frontend fill:#1a1a2e,stroke:#F0B90B,color:#fff
    style Backend fill:#1a1a2e,stroke:#8b5cf6,color:#fff
    style Blockchain fill:#1a1a2e,stroke:#F0B90B,color:#fff
    style ContractModules fill:#0d1117,stroke:#30363d,color:#fff
```

---

## 📐 UML Class Diagram — Smart Contract

```mermaid
classDiagram
    class NFAAgentPassport {
        uint256 SLASH_PERCENT
        uint256 nextTokenId
        uint256 nextTaskId
        mapping agents
        mapping categoryReputation
        mapping tasks
        mintAgent() uint256
        stake(tokenId)
        createTask(tokenId, category, deadline) uint256
        submitTaskResult(taskId, resultHash)
        validateTask(taskId)
        disputeTask(taskId)
        autoSlash(taskId)
        getAgentScore(tokenId) AgentScore
        getCategoryReputation(tokenId, category) uint256
        pause(tokenId)
        unpause(tokenId)
        terminate(tokenId)
        executeAction(tokenId, data) bytes
        upgradeLogic(tokenId, newLogic)
        fundAgent(tokenId)
        updateMetadata(tokenId, metadata)
    }

    class AgentData {
        uint256 stake
        uint256 reputation
        uint256 tasksCompleted
        uint256 tasksFailed
        uint256 totalValueHandled
        uint256 lastActionTimestamp
        bool active
        Status bapStatus
        address logicAddress
        AgentMetadata metadata
    }

    class Task {
        uint256 tokenId
        address requester
        Category category
        uint256 reward
        uint256 deadline
        bytes32 resultHash
        TaskStatus status
    }

    class AgentScore {
        uint256 stakeAmount
        uint256 reputation
        uint256 successRate
        uint256 tasksCompleted
        uint256 tasksFailed
        uint256 totalValueHandled
    }

    class Category {
        <<enumeration>>
        General
        Coding
        Writing
        Analysis
        Creative
        Research
    }

    class TaskStatus {
        <<enumeration>>
        Created
        Submitted
        Validated
        Disputed
        Slashed
    }

    class Status {
        <<enumeration>>
        Active
        Paused
        Terminated
    }

    NFAAgentPassport "1" --> "*" AgentData : agents mapping
    NFAAgentPassport "1" --> "*" Task : tasks mapping
    NFAAgentPassport ..> AgentScore : returns
    Task --> Category
    Task --> TaskStatus
    AgentData --> Status
```

---

## 🔄 Task Lifecycle — Sequence Diagram

```mermaid
sequenceDiagram
    actor User as 👤 Task Requester
    participant FE as ⚛️ Frontend
    participant MM as 🦊 MetaMask
    participant SC as ⛓️ NFAAgentPassport
    participant BE as 🤖 AI Backend
    participant AI as 🧠 Groq LLM

    Note over User, AI: 1️⃣ Task Creation (Escrow)
    User->>FE: Create task (prompt, category, deadline)
    FE->>MM: Sign createTask() + BNB escrow
    MM->>SC: createTask(tokenId, category, deadline) {value: reward}
    SC-->>FE: TaskCreated event (taskId)

    Note over User, AI: 2️⃣ AI Execution
    FE->>BE: POST /api/execute-task {prompt, category}
    BE->>AI: chat.completions.create()
    AI-->>BE: AI result text
    BE->>BE: keccak256(result) → resultHash

    Note over User, AI: 3️⃣ Result Submission
    BE->>MM: Sign submitTaskResult()
    MM->>SC: submitTaskResult(taskId, resultHash)
    SC-->>FE: TaskSubmitted event

    Note over User, AI: 4️⃣ Outcome

    alt ✅ Validation
        User->>FE: Validate task
        FE->>MM: Sign validateTask()
        MM->>SC: validateTask(taskId)
        SC->>SC: reputation += reward/1e15
        SC->>User: Transfer escrow reward
        SC-->>FE: TaskValidated event
    else ❌ Dispute
        User->>FE: Dispute task
        FE->>MM: Sign disputeTask()
        MM->>SC: disputeTask(taskId)
        SC->>SC: slash 20% agent stake
        SC->>SC: reputation -= penaltyWeight
        SC->>User: Refund escrow
        SC-->>FE: TaskDisputed event
    else ⏰ Timeout
        User->>FE: Auto-slash expired task
        FE->>MM: Sign autoSlash()
        MM->>SC: autoSlash(taskId)
        SC->>SC: slash 20% agent stake
        SC->>User: Refund escrow
        SC-->>FE: TaskSlashed event
    end
```

---

## 🏗️ Architecture

```
nfa-passport/
├── contracts/                 # Solidity smart contracts
│   ├── NFAAgentPassport.sol   # Core contract (ERC-721 + BAP-578)
│   └── interfaces/IBAP578.sol # BAP-578 interface
├── frontend/                  # Next.js 16 web application
│   └── src/
│       ├── app/               # Pages: home, mint, agents, tasks, leaderboard
│       ├── components/        # Navbar, AnimatedBackground, Toast, etc.
│       └── lib/               # Contract ABI, Web3 providers
├── backend/
│   └── execute-task.js        # Groq AI task execution + on-chain submission
├── scripts/deploy.js          # Hardhat deployment script
├── test/                      # Hardhat test suite
├── docker-compose.yml         # Container orchestration
└── hardhat.config.js          # Hardhat configuration
```

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20 · OpenZeppelin · Hardhat |
| Frontend | Next.js 16 · React 19 · TypeScript · TailwindCSS 4 |
| Web3 | wagmi · viem · RainbowKit |
| AI Backend | Groq SDK (Llama 3.3 70B) · ethers.js |
| Deployment | BNB Chain Testnet · Docker |

---

## 🚀 Setup & Run

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) (optional, for containerized setup)
- [MetaMask](https://metamask.io/) browser extension
- tBNB for gas — get from [BNB Faucet](https://www.bnbchain.org/en/testnet-faucet)

### Option A: Docker (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/rajnishkumar13500/BNB-Hackathon.git
cd BNB-Hackathon

# 2. Set up environment variables
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
# Fill in your keys in both files

# 3. Build and start
docker compose up --build

# Frontend is live at http://localhost:3000
```

**Run Hardhat commands inside Docker:**

```bash
# Compile contracts
docker compose run --rm hardhat npx hardhat compile

# Run tests
docker compose run --rm hardhat npx hardhat test

# Deploy to BNB Testnet
docker compose run --rm hardhat npx hardhat run scripts/deploy.js --network bnbTestnet
```

### Option B: Local Development

```bash
# 1. Clone and install root dependencies
git clone https://github.com/rajnishkumar13500/BNB-Hackathon.git
cd BNB-Hackathon
npm install

# 2. Set up environment variables
cp .env.example .env        # Add DEPLOYER_PRIVATE_KEY, GROQ_API_KEY
cp frontend/.env.local.example frontend/.env.local  # Add contract address

# 3. Compile & deploy contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network bnbTestnet
# Copy the deployed CONTRACT_ADDRESS to .env and frontend/.env.local

# 4. Start frontend
cd frontend
npm install
npm run dev
# Open http://localhost:3000

# 5. Run AI tasks (optional)
node backend/execute-task.js --prompt "Summarize BNB Chain" --taskId 0 --submit
```

### Environment Variables

| File | Variable | Description |
|---|---|---|
| `.env` | `DEPLOYER_PRIVATE_KEY` | Wallet private key (funded with tBNB) |
| `.env` | `GROQ_API_KEY` | [Groq Console](https://console.groq.com/keys) API key |
| `.env` | `CONTRACT_ADDRESS` | Deployed contract address |
| `.env` | `BSCSCAN_API_KEY` | BSCScan key (optional, for verification) |
| `frontend/.env.local` | `NEXT_PUBLIC_CONTRACT_ADDRESS` | Same contract address |
| `frontend/.env.local` | `GROQ_API_KEY` | Same Groq API key |

---

## 👥 Target Users

| User Segment | Use Case |
|---|---|
| **AI Agent Builders** | Give agents a verifiable, portable identity with economic stake |
| **Task Requesters** | Post escrow-funded tasks with built-in accountability |
| **NFT Traders** | Trade agents as economic assets — reputation + stake = value |
| **Enterprise** | Deploy accountable AI workforce with transparent performance |

---

## 💼 Business Model

```
┌─────────────────────────────────────────────────────┐
│                  Revenue Streams                     │
├──────────────────┬──────────────────────────────────┤
│ Minting Fees     │ Fee for creating new NFA agents  │
│ Task Fees        │ % commission on escrow tasks     │
│ Slashing Pool    │ Slashed BNB redistributed to     │
│                  │ protocol treasury                │
│ Premium Tiers    │ Enhanced agent features &        │
│                  │ priority task matching            │
│ API Access       │ Paid access to reputation        │
│                  │ scoring data for DeFi protocols  │
└──────────────────┴──────────────────────────────────┘
```

**Unit Economics:**
- Agents with higher reputation & stake → more valuable NFTs → higher trading volume
- More tasks completed → more commission → flywheel growth
- Slashing creates deflationary pressure → increases remaining stake value

---

## 📈 Go-To-Market Strategy

### Phase 1 — Community Launch *(Month 1–2)*
- Launch on BNB Chain testnet (✅ done)
- Target BNB Chain hackathon ecosystem & developer communities
- Create tutorials & documentation for agent builders
- Partner with BNB Chain grants program

### Phase 2 — Mainnet & Partnerships *(Month 3–4)*
- Deploy to BNB Chain mainnet
- Integrate with existing AI agent frameworks (AutoGPT, CrewAI, LangChain)
- Partner with DeFi protocols for NFA-as-collateral use cases
- Launch ambassador program in AI + Web3 communities

### Phase 3 — Ecosystem Growth *(Month 5–8)*
- Launch task marketplace with agent matching
- API for DeFi protocols to query agent reputation scores
- Cross-chain expansion (Ethereum, Polygon, Arbitrum)
- Enterprise SDK for deploying managed AI fleets

### Phase 4 — Credit Layer *(Month 9–12)*
- NFA-backed lending protocol (agent reputation = credit score)
- BNPL for AI services (use now, pay from task earnings)
- Institutional partnerships for AI credit scoring
- Governance token launch for protocol decentralization

---

## 🗺️ Product Roadmap

```mermaid
gantt
    title NFA Passport Roadmap
    dateFormat YYYY-MM
    axisFormat %b %Y
    
    section Core Protocol
    Smart Contract (BAP-578)       :done, core1, 2026-02, 2026-03
    Staking & Slashing             :done, core2, 2026-02, 2026-03
    Task Lifecycle & Escrow        :done, core3, 2026-02, 2026-03
    Reputation Engine              :done, core4, 2026-02, 2026-03
    
    section Frontend
    Mint & Agent Dashboard         :done, fe1, 2026-02, 2026-03
    Task Management UI             :done, fe2, 2026-02, 2026-03
    Leaderboard                    :done, fe3, 2026-02, 2026-03
    
    section Infrastructure
    Docker Setup                   :done, infra1, 2026-02, 2026-03
    CI/CD Pipeline                 :        infra2, 2026-04, 2026-05
    Monitoring & Analytics         :        infra3, 2026-05, 2026-06
    
    section Growth
    Mainnet Deployment             :        grow1, 2026-04, 2026-05
    AI Framework Integrations      :        grow2, 2026-05, 2026-07
    Task Marketplace               :        grow3, 2026-06, 2026-08
    Reputation API for DeFi        :        grow4, 2026-07, 2026-09
    
    section Credit Layer
    NFA-Backed Lending             :        credit1, 2026-09, 2026-11
    BNPL for AI Services           :        credit2, 2026-10, 2026-12
    Cross-Chain Expansion          :        credit3, 2026-11, 2027-02
```

### Feature Status

| Feature | Status |
|---|---|
| ERC-721 NFA Minting | ✅ Live |
| BNB Staking Vault | ✅ Live |
| Escrow Task Creation | ✅ Live |
| AI Task Execution (Groq) | ✅ Live |
| On-Chain Result Hashing | ✅ Live |
| Task Validation & Dispute | ✅ Live |
| 20% Stake Slashing | ✅ Live |
| Global + Category Reputation | ✅ Live |
| Agent Leaderboard | ✅ Live |
| BAP-578 Full Compliance | ✅ Live |
| Docker Deployment | ✅ Live |
| Mainnet Deployment | 🔜 Planned |
| Task Marketplace | 🔜 Planned |
| Cross-Chain Support | 🔜 Planned |
| NFA-Backed Lending | 🔜 Planned |

---

## 🔒 Security

- **ReentrancyGuard** on all fund-transfer functions
- **Checks-Effects-Interactions** pattern enforced
- **No double validation/slashing** — task status transitions are one-way
- **Deadline enforcement** — expired tasks can be auto-slashed
- **Stake follows NFT** — no orphaned collateral on transfer
- **No admin keys** — fully permissionless protocol (no `Ownable`)
- **Secrets via env files** — never baked into Docker images

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built for the BNB Chain Bengaluru Hackathon 🇮🇳</strong><br/>
  <em>Smart Collateral for Web3 Credit & BNPL Track</em>
</p>
