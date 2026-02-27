require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
    },
  },
};

// Only add bnbTestnet network when private key is configured
if (DEPLOYER_PRIVATE_KEY) {
  config.networks.bnbTestnet = {
    url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    accounts: [DEPLOYER_PRIVATE_KEY],
  };
}

module.exports = config;
