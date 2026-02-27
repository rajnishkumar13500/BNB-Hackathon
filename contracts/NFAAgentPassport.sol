// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IBAP578.sol";

/**
 * @title NFAAgentPassport
 * @notice BAP-578 compliant Non-Fungible Agent passport with staking, escrow tasks, 
 *         slashing, and onchain reputation. Smart collateral vault for AI agents on BNB Chain.
 * @dev Extends ERC-721 with BAP-578 interface. Stake and reputation are bound to tokenId 
 *      and transfer automatically with the NFT.
 */
contract NFAAgentPassport is ERC721, IBAP578, ReentrancyGuard {

    // ─── Enums ───────────────────────────────────────────────────────────

    enum Category { General, Coding, Writing, Analysis, Creative, Research }
    enum TaskStatus { Created, Submitted, Validated, Disputed, Slashed }

    // ─── Structs ─────────────────────────────────────────────────────────

    struct AgentData {
        uint256 stake;
        uint256 reputation;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 totalValueHandled;
        bool active;
        Status bapStatus;           // BAP-578 status
        address logicAddress;       // BAP-578 logic contract
        uint256 lastActionTimestamp; // BAP-578 last action
        AgentMetadata metadata;     // BAP-578 metadata
    }

    struct Task {
        uint256 tokenId;
        address requester;
        Category category;
        uint256 reward;
        uint256 deadline;
        bytes32 resultHash;
        TaskStatus status;
    }

    // ─── State ───────────────────────────────────────────────────────────

    uint256 private _nextTokenId;
    uint256 private _nextTaskId;

    uint256 public constant SLASH_PERCENT = 20;

    mapping(uint256 => AgentData) public agents;
    mapping(uint256 => mapping(Category => uint256)) public categoryReputation;
    mapping(uint256 => Task) public tasks;

    // ─── Events ──────────────────────────────────────────────────────────

    event AgentMinted(uint256 indexed tokenId, address indexed owner);
    event Staked(uint256 indexed tokenId, uint256 amount);
    event TaskCreated(uint256 indexed taskId, uint256 indexed tokenId, Category category, uint256 reward, uint256 deadline);
    event TaskSubmitted(uint256 indexed taskId, bytes32 resultHash);
    event TaskValidated(uint256 indexed taskId, uint256 reward);
    event TaskDisputed(uint256 indexed taskId, uint256 slashAmount);
    event Slashed(uint256 indexed tokenId, uint256 amount, uint256 newStake);

    // ─── Modifiers ───────────────────────────────────────────────────────

    modifier onlyAgentOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not agent owner");
        _;
    }

    modifier agentExists(uint256 tokenId) {
        require(tokenId < _nextTokenId, "Agent does not exist");
        _;
    }

    modifier agentActive(uint256 tokenId) {
        require(agents[tokenId].active, "Agent not active");
        require(agents[tokenId].bapStatus == Status.Active, "Agent paused or terminated");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────

    constructor() ERC721("NFA Agent Passport", "NFA") {}

    // ─── Mint ────────────────────────────────────────────────────────────

    /**
     * @notice Mint a new NFA agent passport
     * @return tokenId The ID of the newly minted agent
     */
    function mintAgent() external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        agents[tokenId].active = true;
        agents[tokenId].bapStatus = Status.Active;

        emit AgentMinted(tokenId, msg.sender);
        return tokenId;
    }

    // ─── Staking ─────────────────────────────────────────────────────────

    /**
     * @notice Stake BNB into an agent's collateral vault
     * @param tokenId The agent to stake into
     */
    function stake(uint256 tokenId) external payable agentExists(tokenId) onlyAgentOwner(tokenId) agentActive(tokenId) {
        require(msg.value > 0, "Must stake > 0");

        agents[tokenId].stake += msg.value;

        emit Staked(tokenId, msg.value);
    }

    // ─── Task Lifecycle ──────────────────────────────────────────────────

    /**
     * @notice Create an escrow-funded task assigned to an agent
     * @param tokenId The agent assigned to the task
     * @param category Task category for reputation tracking
     * @param deadline Unix timestamp deadline
     * @return taskId The ID of the created task
     */
    function createTask(
        uint256 tokenId,
        Category category,
        uint256 deadline
    ) external payable agentExists(tokenId) agentActive(tokenId) returns (uint256) {
        require(msg.value > 0, "Must escrow reward");
        require(deadline > block.timestamp, "Deadline must be future");

        uint256 taskId = _nextTaskId++;
        tasks[taskId] = Task({
            tokenId: tokenId,
            requester: msg.sender,
            category: category,
            reward: msg.value,
            deadline: deadline,
            resultHash: bytes32(0),
            status: TaskStatus.Created
        });

        agents[tokenId].totalValueHandled += msg.value;

        emit TaskCreated(taskId, tokenId, category, msg.value, deadline);
        return taskId;
    }

    /**
     * @notice Submit AI task result hash (only agent owner)
     * @param taskId The task to submit result for
     * @param resultHash keccak256 hash of the AI result
     */
    function submitTaskResult(uint256 taskId, bytes32 resultHash) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Created, "Task not in Created state");
        require(ownerOf(task.tokenId) == msg.sender, "Not agent owner");
        require(block.timestamp <= task.deadline, "Deadline passed");
        require(resultHash != bytes32(0), "Empty hash");

        task.resultHash = resultHash;
        task.status = TaskStatus.Submitted;

        agents[task.tokenId].lastActionTimestamp = block.timestamp;

        emit TaskSubmitted(taskId, resultHash);
    }

    /**
     * @notice Validate a submitted task — releases escrow reward and increases reputation
     * @param taskId The task to validate
     */
    function validateTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Submitted, "Task not submitted");
        require(task.requester == msg.sender, "Not task requester");

        task.status = TaskStatus.Validated;

        // Update reputation
        AgentData storage agent = agents[task.tokenId];
        agent.tasksCompleted++;
        agent.reputation += task.reward / 1e15; // per spec
        categoryReputation[task.tokenId][task.category] += task.reward / 1e15;

        // Release escrow to agent owner
        address agentOwner = ownerOf(task.tokenId);
        (bool sent, ) = agentOwner.call{value: task.reward}("");
        require(sent, "Reward transfer failed");

        emit TaskValidated(taskId, task.reward);
    }

    /**
     * @notice Dispute a task — slashes 20% of agent stake
     * @param taskId The task to dispute
     */
    function disputeTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(
            task.status == TaskStatus.Created || task.status == TaskStatus.Submitted,
            "Cannot dispute"
        );
        require(task.requester == msg.sender, "Not task requester");

        task.status = TaskStatus.Disputed;
        _slash(task.tokenId);

        // Refund escrow to requester
        (bool sent, ) = task.requester.call{value: task.reward}("");
        require(sent, "Refund transfer failed");
    }

    /**
     * @notice Auto-slash an overdue task — callable by anyone after deadline
     * @param taskId The overdue task
     */
    function autoSlash(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(
            task.status == TaskStatus.Created || task.status == TaskStatus.Submitted,
            "Cannot slash"
        );
        require(block.timestamp > task.deadline, "Deadline not passed");

        task.status = TaskStatus.Slashed;
        _slash(task.tokenId);

        // Refund escrow to requester
        (bool sent, ) = task.requester.call{value: task.reward}("");
        require(sent, "Refund transfer failed");
    }

    // ─── Reputation ──────────────────────────────────────────────────────

    struct AgentScore {
        uint256 stakeAmount;
        uint256 reputation;
        uint256 successRate;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 totalValueHandled;
    }

    /**
     * @notice Get comprehensive agent score
     * @param tokenId The agent to query
     * @return score The agent's full score breakdown
     */
    function getAgentScore(uint256 tokenId) external view agentExists(tokenId) returns (AgentScore memory score) {
        AgentData storage agent = agents[tokenId];
        uint256 total = agent.tasksCompleted + agent.tasksFailed;

        score = AgentScore({
            stakeAmount: agent.stake,
            reputation: agent.reputation,
            successRate: total > 0 ? (agent.tasksCompleted * 100) / total : 0,
            tasksCompleted: agent.tasksCompleted,
            tasksFailed: agent.tasksFailed,
            totalValueHandled: agent.totalValueHandled
        });
    }

    /**
     * @notice Get category-specific reputation
     * @param tokenId The agent to query
     * @param category The category
     * @return The reputation score for that category
     */
    function getCategoryReputation(uint256 tokenId, Category category) external view agentExists(tokenId) returns (uint256) {
        return categoryReputation[tokenId][category];
    }

    // ─── BAP-578 Implementation ──────────────────────────────────────────

    /**
     * @notice Execute an action on behalf of the agent (BAP-578)
     */
    function executeAction(uint256 tokenId, bytes calldata data) external override onlyAgentOwner(tokenId) agentActive(tokenId) {
        agents[tokenId].lastActionTimestamp = block.timestamp;

        // If logic contract is set, forward the call
        if (agents[tokenId].logicAddress != address(0)) {
            (bool success, bytes memory result) = agents[tokenId].logicAddress.call(data);
            require(success, "Action execution failed");
            emit ActionExecuted(msg.sender, result);
        } else {
            emit ActionExecuted(msg.sender, data);
        }
    }

    /**
     * @notice Set logic contract address for an agent (BAP-578)
     */
    function setLogicAddress(uint256 tokenId, address newLogic) external override onlyAgentOwner(tokenId) {
        address oldLogic = agents[tokenId].logicAddress;
        agents[tokenId].logicAddress = newLogic;
        emit LogicUpgraded(msg.sender, oldLogic, newLogic);
    }

    /**
     * @notice Fund an agent with BNB (BAP-578) — adds to stake
     */
    function fundAgent(uint256 tokenId) external payable override agentExists(tokenId) agentActive(tokenId) {
        require(msg.value > 0, "Must fund > 0");
        agents[tokenId].stake += msg.value;
        emit AgentFunded(msg.sender, msg.sender, msg.value);
        emit Staked(tokenId, msg.value);
    }

    /**
     * @notice Get agent state (BAP-578)
     */
    function getState(uint256 tokenId) external view override agentExists(tokenId) returns (State memory) {
        AgentData storage agent = agents[tokenId];
        return State({
            balance: agent.stake,
            status: agent.bapStatus,
            owner: ownerOf(tokenId),
            logicAddress: agent.logicAddress,
            lastActionTimestamp: agent.lastActionTimestamp
        });
    }

    /**
     * @notice Get agent metadata (BAP-578)
     */
    function getAgentMetadata(uint256 tokenId) external view override agentExists(tokenId) returns (AgentMetadata memory) {
        return agents[tokenId].metadata;
    }

    /**
     * @notice Update agent metadata (BAP-578)
     */
    function updateAgentMetadata(uint256 tokenId, AgentMetadata memory metadata) external override onlyAgentOwner(tokenId) {
        agents[tokenId].metadata = metadata;
        emit MetadataUpdated(tokenId, metadata.vaultURI);
    }

    /**
     * @notice Pause an agent (BAP-578)
     */
    function pause(uint256 tokenId) external override onlyAgentOwner(tokenId) {
        require(agents[tokenId].bapStatus == Status.Active, "Not active");
        agents[tokenId].bapStatus = Status.Paused;
        emit StatusChanged(msg.sender, Status.Paused);
    }

    /**
     * @notice Unpause an agent (BAP-578)
     */
    function unpause(uint256 tokenId) external override onlyAgentOwner(tokenId) {
        require(agents[tokenId].bapStatus == Status.Paused, "Not paused");
        agents[tokenId].bapStatus = Status.Active;
        emit StatusChanged(msg.sender, Status.Active);
    }

    /**
     * @notice Terminate an agent (BAP-578) — returns stake to owner
     */
    function terminate(uint256 tokenId) external override onlyAgentOwner(tokenId) nonReentrant {
        require(agents[tokenId].bapStatus != Status.Terminated, "Already terminated");

        agents[tokenId].bapStatus = Status.Terminated;
        agents[tokenId].active = false;

        // Return remaining stake to owner
        uint256 remainingStake = agents[tokenId].stake;
        if (remainingStake > 0) {
            agents[tokenId].stake = 0;
            (bool sent, ) = msg.sender.call{value: remainingStake}("");
            require(sent, "Stake return failed");
        }

        emit StatusChanged(msg.sender, Status.Terminated);
    }

    // ─── Internal ────────────────────────────────────────────────────────

    /**
     * @dev Internal slash logic — 20% of agent stake
     */
    function _slash(uint256 tokenId) internal {
        AgentData storage agent = agents[tokenId];
        uint256 slashAmount = (agent.stake * SLASH_PERCENT) / 100;

        agent.tasksFailed++;

        if (slashAmount > 0) {
            agent.stake -= slashAmount;
            // Reputation penalty proportional to slash
            uint256 penaltyWeight = slashAmount / 1e15;
            if (penaltyWeight > agent.reputation) {
                agent.reputation = 0;
            } else {
                agent.reputation -= penaltyWeight;
            }
        }

        emit Slashed(tokenId, slashAmount, agent.stake);
    }

    // ─── View Helpers ────────────────────────────────────────────────────

    function totalAgents() external view returns (uint256) {
        return _nextTokenId;
    }

    function totalTasks() external view returns (uint256) {
        return _nextTaskId;
    }

    /**
     * @notice Check if ERC-165 interface is supported (BAP-578 + ERC-721)
     */
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
