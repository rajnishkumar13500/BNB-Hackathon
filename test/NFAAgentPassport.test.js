const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("NFAAgentPassport", function () {
    let passport;
    let owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        const NFAAgentPassport = await ethers.getContractFactory("NFAAgentPassport");
        passport = await NFAAgentPassport.deploy();
        await passport.waitForDeployment();
    });

    // ─── Minting ──────────────────────────────────────────────────────

    describe("Minting", function () {
        it("should mint an agent and assign ownership", async function () {
            const tx = await passport.connect(user1).mintAgent();
            const receipt = await tx.wait();

            expect(await passport.ownerOf(0)).to.equal(user1.address);
            expect(await passport.totalAgents()).to.equal(1);
        });

        it("should initialize agent as active", async function () {
            await passport.connect(user1).mintAgent();
            const state = await passport.getState(0);

            expect(state.status).to.equal(0); // Status.Active
            expect(state.balance).to.equal(0);
            expect(state.owner).to.equal(user1.address);
        });

        it("should mint multiple agents with incrementing IDs", async function () {
            await passport.connect(user1).mintAgent();
            await passport.connect(user2).mintAgent();

            expect(await passport.ownerOf(0)).to.equal(user1.address);
            expect(await passport.ownerOf(1)).to.equal(user2.address);
            expect(await passport.totalAgents()).to.equal(2);
        });
    });

    // ─── Staking ──────────────────────────────────────────────────────

    describe("Staking", function () {
        beforeEach(async function () {
            await passport.connect(user1).mintAgent();
        });

        it("should allow owner to stake BNB", async function () {
            const stakeAmount = ethers.parseEther("1.0");
            await passport.connect(user1).stake(0, { value: stakeAmount });

            const score = await passport.getAgentScore(0);
            expect(score.stakeAmount).to.equal(stakeAmount);
        });

        it("should accumulate stake across multiple deposits", async function () {
            await passport.connect(user1).stake(0, { value: ethers.parseEther("1.0") });
            await passport.connect(user1).stake(0, { value: ethers.parseEther("0.5") });

            const score = await passport.getAgentScore(0);
            expect(score.stakeAmount).to.equal(ethers.parseEther("1.5"));
        });

        it("should reject stake from non-owner", async function () {
            await expect(
                passport.connect(user2).stake(0, { value: ethers.parseEther("1.0") })
            ).to.be.revertedWith("Not agent owner");
        });

        it("should reject zero stake", async function () {
            await expect(
                passport.connect(user1).stake(0, { value: 0 })
            ).to.be.revertedWith("Must stake > 0");
        });
    });

    // ─── Transfer Preserves State ─────────────────────────────────────

    describe("Transfer Preserves State", function () {
        it("should preserve stake and reputation after NFT transfer", async function () {
            await passport.connect(user1).mintAgent();
            await passport.connect(user1).stake(0, { value: ethers.parseEther("2.0") });

            // Transfer NFA from user1 to user2
            await passport.connect(user1).transferFrom(user1.address, user2.address, 0);

            expect(await passport.ownerOf(0)).to.equal(user2.address);
            const score = await passport.getAgentScore(0);
            expect(score.stakeAmount).to.equal(ethers.parseEther("2.0"));
        });
    });

    // ─── Task Lifecycle ───────────────────────────────────────────────

    describe("Task Lifecycle", function () {
        const reward = ethers.parseEther("0.1");
        let deadline;

        beforeEach(async function () {
            await passport.connect(user1).mintAgent();
            await passport.connect(user1).stake(0, { value: ethers.parseEther("1.0") });
            deadline = (await time.latest()) + 3600; // 1 hour from now
        });

        it("should create a task with escrow", async function () {
            await passport.connect(user2).createTask(0, 0, deadline, { value: reward });
            expect(await passport.totalTasks()).to.equal(1);

            const task = await passport.tasks(0);
            expect(task.reward).to.equal(reward);
            expect(task.requester).to.equal(user2.address);
            expect(task.status).to.equal(0); // TaskStatus.Created
        });

        it("should allow agent owner to submit result", async function () {
            await passport.connect(user2).createTask(0, 0, deadline, { value: reward });
            const resultHash = ethers.keccak256(ethers.toUtf8Bytes("AI result output"));

            await passport.connect(user1).submitTaskResult(0, resultHash);
            const task = await passport.tasks(0);
            expect(task.resultHash).to.equal(resultHash);
            expect(task.status).to.equal(1); // TaskStatus.Submitted
        });

        it("should validate task and release reward + reputation", async function () {
            await passport.connect(user2).createTask(0, 0, deadline, { value: reward });
            const resultHash = ethers.keccak256(ethers.toUtf8Bytes("AI result"));
            await passport.connect(user1).submitTaskResult(0, resultHash);

            const balanceBefore = await ethers.provider.getBalance(user1.address);
            await passport.connect(user2).validateTask(0);
            const balanceAfter = await ethers.provider.getBalance(user1.address);

            expect(balanceAfter).to.be.gt(balanceBefore);

            const score = await passport.getAgentScore(0);
            expect(score.tasksCompleted).to.equal(1);
            expect(score.reputation).to.be.gt(0);
        });

        it("should dispute task and slash 20% of stake", async function () {
            await passport.connect(user2).createTask(0, 0, deadline, { value: reward });
            const resultHash = ethers.keccak256(ethers.toUtf8Bytes("bad result"));
            await passport.connect(user1).submitTaskResult(0, resultHash);

            await passport.connect(user2).disputeTask(0);

            const score = await passport.getAgentScore(0);
            // Original stake 1.0 BNB, 20% slashed = 0.8 BNB remaining
            expect(score.stakeAmount).to.equal(ethers.parseEther("0.8"));
            expect(score.tasksFailed).to.equal(1);
        });

        it("should auto-slash after deadline", async function () {
            await passport.connect(user2).createTask(0, 0, deadline, { value: reward });

            // Fast forward past deadline
            await time.increase(3601);

            await passport.connect(user2).autoSlash(0);

            const score = await passport.getAgentScore(0);
            expect(score.stakeAmount).to.equal(ethers.parseEther("0.8"));
            expect(score.tasksFailed).to.equal(1);
        });

        it("should reject duplicate validation", async function () {
            await passport.connect(user2).createTask(0, 0, deadline, { value: reward });
            const resultHash = ethers.keccak256(ethers.toUtf8Bytes("result"));
            await passport.connect(user1).submitTaskResult(0, resultHash);
            await passport.connect(user2).validateTask(0);

            await expect(
                passport.connect(user2).validateTask(0)
            ).to.be.revertedWith("Task not submitted");
        });
    });

    // ─── BAP-578 Lifecycle ────────────────────────────────────────────

    describe("BAP-578 Lifecycle", function () {
        beforeEach(async function () {
            await passport.connect(user1).mintAgent();
        });

        it("should pause and unpause agent", async function () {
            await passport.connect(user1).pause(0);
            let state = await passport.getState(0);
            expect(state.status).to.equal(1); // Paused

            await passport.connect(user1).unpause(0);
            state = await passport.getState(0);
            expect(state.status).to.equal(0); // Active
        });

        it("should not allow staking on paused agent", async function () {
            await passport.connect(user1).pause(0);
            await expect(
                passport.connect(user1).stake(0, { value: ethers.parseEther("1.0") })
            ).to.be.revertedWith("Agent paused or terminated");
        });

        it("should terminate agent and return stake", async function () {
            await passport.connect(user1).stake(0, { value: ethers.parseEther("1.0") });

            const balanceBefore = await ethers.provider.getBalance(user1.address);
            await passport.connect(user1).terminate(0);
            const balanceAfter = await ethers.provider.getBalance(user1.address);

            // Balance should increase (minus gas)
            expect(balanceAfter).to.be.gt(balanceBefore - ethers.parseEther("0.01"));

            const state = await passport.getState(0);
            expect(state.status).to.equal(2); // Terminated
            expect(state.balance).to.equal(0);
        });

        it("should fund agent via BAP-578 fundAgent", async function () {
            await passport.connect(user2).fundAgent(0, { value: ethers.parseEther("0.5") });
            const state = await passport.getState(0);
            expect(state.balance).to.equal(ethers.parseEther("0.5"));
        });

        it("should update agent metadata", async function () {
            const metadata = {
                persona: '{"trait":"helpful"}',
                experience: "AI coding assistant",
                voiceHash: "",
                animationURI: "",
                vaultURI: "ipfs://QmTest",
                vaultHash: ethers.keccak256(ethers.toUtf8Bytes("vault")),
            };

            await passport.connect(user1).updateAgentMetadata(0, metadata);
            const stored = await passport.getAgentMetadata(0);
            expect(stored.persona).to.equal(metadata.persona);
            expect(stored.experience).to.equal(metadata.experience);
            expect(stored.vaultURI).to.equal(metadata.vaultURI);
        });
    });

    // ─── Reputation ───────────────────────────────────────────────────

    describe("Reputation", function () {
        it("should track category reputation separately", async function () {
            await passport.connect(user1).mintAgent();
            await passport.connect(user1).stake(0, { value: ethers.parseEther("1.0") });
            const deadline = (await time.latest()) + 3600;

            // Create and validate a Coding task (category 1)
            await passport.connect(user2).createTask(0, 1, deadline, { value: ethers.parseEther("0.1") });
            const hash = ethers.keccak256(ethers.toUtf8Bytes("code result"));
            await passport.connect(user1).submitTaskResult(0, hash);
            await passport.connect(user2).validateTask(0);

            const codingRep = await passport.getCategoryReputation(0, 1);
            const writingRep = await passport.getCategoryReputation(0, 2);
            expect(codingRep).to.be.gt(0);
            expect(writingRep).to.equal(0);
        });
    });
});
