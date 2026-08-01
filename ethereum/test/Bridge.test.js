const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bridge Contract", function () {
  let token;
  let bridge;
  let owner;
  let relayer;
  let user;
  let recipient;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1,000,000 TBT
  const DEPOSIT_AMOUNT = ethers.parseEther("100");
  const SOLANA_RECIPIENT = "9xQeWvG816bUx9EPjHmaT23yvVM2VJ8U7GkWn3X9vV3";

  beforeEach(async function () {
    [owner, relayer, user, recipient] = await ethers.getSigners();

    // Deploy test token
    const TokenFactory = await ethers.getContractFactory("MyToken");
    token = await TokenFactory.deploy("Test Bridge Token", "TBT", INITIAL_SUPPLY);
    await token.waitForDeployment();

    // Deploy bridge
    const BridgeFactory = await ethers.getContractFactory("Bridge");
    bridge = await BridgeFactory.deploy(relayer.address, await token.getAddress());
    await bridge.waitForDeployment();

    // Transfer some tokens to user for testing
    await token.transfer(user.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set correct relayer and supported token", async function () {
      expect(await bridge.relayer()).to.equal(relayer.address);
      expect(await bridge.supportedToken()).to.equal(await token.getAddress());
    });
  });

  describe("Deposit (Locking)", function () {
    it("Should lock tokens and emit DepositCreated event", async function () {
      const tokenAddress = await token.getAddress();
      const bridgeAddress = await bridge.getAddress();

      // Approve bridge contract
      await token.connect(user).approve(bridgeAddress, DEPOSIT_AMOUNT);

      // Deposit tokens
      await expect(bridge.connect(user).deposit(tokenAddress, DEPOSIT_AMOUNT, SOLANA_RECIPIENT))
        .to.emit(bridge, "DepositCreated");

      expect(await bridge.lockedBalance(tokenAddress)).to.equal(DEPOSIT_AMOUNT);
      expect(await token.balanceOf(bridgeAddress)).to.equal(DEPOSIT_AMOUNT);

      const depositInfo = await bridge.getDeposit(1);
      expect(depositInfo.user).to.equal(user.address);
      expect(depositInfo.amount).to.equal(DEPOSIT_AMOUNT);
      expect(depositInfo.solanaRecipient).to.equal(SOLANA_RECIPIENT);
      expect(depositInfo.processed).to.be.false;
    });

    it("Should revert if token is unsupported or amount is 0", async function () {
      const bridgeAddress = await bridge.getAddress();
      await token.connect(user).approve(bridgeAddress, DEPOSIT_AMOUNT);

      await expect(
        bridge.connect(user).deposit(ethers.ZeroAddress, DEPOSIT_AMOUNT, SOLANA_RECIPIENT)
      ).to.be.revertedWith("Bridge: unsupported token");

      await expect(
        bridge.connect(user).deposit(await token.getAddress(), 0, SOLANA_RECIPIENT)
      ).to.be.revertedWith("Bridge: amount must be greater than zero");
    });
  });

  describe("Withdrawal (Unlocking)", function () {
    const solanaTxHash = ethers.id("SOL_BURN_TX_HASH_123");

    beforeEach(async function () {
      const tokenAddress = await token.getAddress();
      const bridgeAddress = await bridge.getAddress();

      // Lock tokens first so bridge contract has balance
      await token.connect(user).approve(bridgeAddress, DEPOSIT_AMOUNT);
      await bridge.connect(user).deposit(tokenAddress, DEPOSIT_AMOUNT, SOLANA_RECIPIENT);
    });

    it("Should allow relayer to unlock tokens and emit WithdrawalCompleted", async function () {
      const initialRecipientBalance = await token.balanceOf(recipient.address);

      await expect(bridge.connect(relayer).withdraw(solanaTxHash, recipient.address, DEPOSIT_AMOUNT))
        .to.emit(bridge, "WithdrawalCompleted");

      expect(await token.balanceOf(recipient.address)).to.equal(initialRecipientBalance + DEPOSIT_AMOUNT);
      expect(await bridge.processedWithdrawals(solanaTxHash)).to.be.true;
    });

    it("Should prevent duplicate withdrawals (replay protection)", async function () {
      await bridge.connect(relayer).withdraw(solanaTxHash, recipient.address, DEPOSIT_AMOUNT);

      await expect(
        bridge.connect(relayer).withdraw(solanaTxHash, recipient.address, DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Bridge: withdrawal already processed");
    });

    it("Should prevent non-relayer from calling withdraw", async function () {
      await expect(
        bridge.connect(user).withdraw(solanaTxHash, recipient.address, DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Bridge: caller is not the relayer");
    });
  });
});
