import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy MyToken
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 TBT
  const MyTokenFactory = await ethers.getContractFactory("MyToken");
  const token = await MyTokenFactory.deploy("Test Bridge Token", "TBT", initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("MyToken deployed to:", tokenAddress);

  // 2. Deploy Bridge (Relayer set to deployer by default for dev/testing)
  const relayerAddress = process.env.RELAYER_ETH_ADDRESS || deployer.address;
  const BridgeFactory = await ethers.getContractFactory("Bridge");
  const bridge = await BridgeFactory.deploy(relayerAddress, tokenAddress);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("Bridge deployed to:", bridgeAddress);
  console.log("Configured Relayer address:", relayerAddress);

  console.log("\n--- Deployment Summary ---");
  console.log(`MYTOKEN_ADDRESS=${tokenAddress}`);
  console.log(`ETH_BRIDGE_ADDRESS=${bridgeAddress}`);
  console.log(`RELAYER_ETH_ADDRESS=${relayerAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
