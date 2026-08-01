const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying Ethereum contracts to Sepolia with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.warn("⚠️ Warning: Account balance is 0 ETH. Make sure you have Sepolia ETH from a faucet!");
  }

  // 1. Deploy MyToken (Test Bridge Token - TBT)
  console.log("\n[1/2] Deploying MyToken (ERC-20)...");
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 TBT
  const MyTokenFactory = await ethers.getContractFactory("MyToken");
  const token = await MyTokenFactory.deploy("Test Bridge Token", "TBT", initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ MyToken deployed to:", tokenAddress);

  // 2. Deploy Bridge (Relayer set to deployer by default for dev/testing)
  console.log("\n[2/2] Deploying Bridge Contract...");
  const relayerAddress = process.env.RELAYER_ETH_ADDRESS || deployer.address;
  const BridgeFactory = await ethers.getContractFactory("Bridge");
  const bridge = await BridgeFactory.deploy(relayerAddress, tokenAddress);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("✅ Bridge deployed to:", bridgeAddress);
  console.log("   Configured Relayer Address:", relayerAddress);

  console.log("\n==================================================");
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log(`MYTOKEN_ADDRESS=${tokenAddress}`);
  console.log(`ETH_BRIDGE_ADDRESS=${bridgeAddress}`);
  console.log(`RELAYER_ETH_ADDRESS=${relayerAddress}`);
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error("❌ Deployment Error:", error);
  process.exitCode = 1;
});
