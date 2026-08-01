import { ethers } from 'ethers';
import { config } from '../config';

const BRIDGE_ABI = [
  "event DepositCreated(uint256 indexed depositId, address indexed user, address indexed token, uint256 amount, string solanaRecipient, uint256 timestamp)",
  "event WithdrawalCompleted(bytes32 indexed solanaTxHash, address indexed recipient, address indexed token, uint256 amount, uint256 timestamp)",
  "function withdraw(bytes32 solanaTxHash, address recipient, uint256 amount) external",
  "function lockedBalance(address token) external view returns (uint256)",
  "function deposits(uint256 depositId) external view returns (uint256 depositId, address user, address token, uint256 amount, string memory solanaRecipient, uint256 timestamp, bool processed)"
];

export class EthereumService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private bridgeContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
    this.wallet = new ethers.Wallet(config.ethereum.relayerPrivateKey, this.provider);
    
    const bridgeAddress = config.ethereum.bridgeAddress || ethers.ZeroAddress;
    this.bridgeContract = new ethers.Contract(bridgeAddress, BRIDGE_ABI, this.wallet);
  }

  public getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  public getRelayerAddress(): string {
    return this.wallet.address;
  }

  /**
   * Subscribe to DepositCreated events on Ethereum Bridge contract
   */
  public listenToDepositEvents(onDeposit: (depositData: {
    depositId: string;
    user: string;
    amount: string;
    solanaRecipient: string;
    timestamp: number;
    ethTxHash: string;
  }) => void): void {
    if (!config.ethereum.bridgeAddress || config.ethereum.bridgeAddress === ethers.ZeroAddress) {
      console.warn('[EthereumService] Bridge contract address not set. Listener skipped.');
      return;
    }

    console.log(`[EthereumService] Listening for DepositCreated events at ${config.ethereum.bridgeAddress}...`);

    this.bridgeContract.on("DepositCreated", (depositId, user, token, amount, solanaRecipient, timestamp, event) => {
      console.log(`[Ethereum] Deposit Event Detected: ID=${depositId.toString()}, User=${user}, Amount=${amount.toString()}, SolanaRecipient=${solanaRecipient}`);
      
      onDeposit({
        depositId: depositId.toString(),
        user,
        amount: amount.toString(),
        solanaRecipient,
        timestamp: Number(timestamp),
        ethTxHash: event.log.transactionHash
      });
    });
  }

  /**
   * Unlock tokens on Ethereum by executing Bridge.withdraw()
   */
  public async unlockTokens(solanaTxHashStr: string, recipient: string, amountWei: string): Promise<string> {
    console.log(`[EthereumService] Executing unlock on Ethereum for Recipient=${recipient}, Amount=${amountWei}, SolanaTx=${solanaTxHashStr}`);
    
    // Hash solana Tx string into bytes32 if necessary
    const solanaTxHashBytes32 = ethers.isHexString(solanaTxHashStr, 32)
      ? solanaTxHashStr
      : ethers.id(solanaTxHashStr);

    const tx = await this.bridgeContract.withdraw(solanaTxHashBytes32, recipient, BigInt(amountWei));
    console.log(`[EthereumService] Unlock Tx submitted: ${tx.hash}. Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`[EthereumService] Unlock Tx confirmed in block ${receipt.blockNumber}`);
    
    return tx.hash;
  }

  /**
   * Check bridge contract ERC-20 locked balance
   */
  public async getLockedBalance(): Promise<string> {
    if (!config.ethereum.bridgeAddress || !config.ethereum.tokenAddress) return '0';
    try {
      const balance = await this.bridgeContract.lockedBalance(config.ethereum.tokenAddress);
      return balance.toString();
    } catch {
      return '0';
    }
  }
}
