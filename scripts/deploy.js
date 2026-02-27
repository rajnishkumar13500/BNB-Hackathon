const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying NFAAgentPassport to", hre.network.name, "...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

    const NFAAgentPassport = await ethers.getContractFactory("NFAAgentPassport");
    const passport = await NFAAgentPassport.deploy();
    await passport.waitForDeployment();

    const address = await passport.getAddress();
    console.log("✅ NFAAgentPassport deployed to:", address);
    console.log("\nAdd this to your .env:");
    console.log(`CONTRACT_ADDRESS=${address}`);

    // Verify on BSCScan if not localhost
    if (hre.network.name === "bnbTestnet") {
        console.log("\nWaiting for block confirmations...");
        await passport.deploymentTransaction().wait(5);
        console.log("Verifying contract on BSCScan...");
        try {
            await hre.run("verify:verify", {
                address: address,
                constructorArguments: [],
            });
            console.log("✅ Contract verified on BSCScan");
        } catch (e) {
            console.log("⚠️  Verification failed:", e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
