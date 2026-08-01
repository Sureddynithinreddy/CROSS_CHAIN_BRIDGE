import { DepositModel, WithdrawalModel, BridgeStatus, IDeposit, IWithdrawal } from '../database/models';
import { EthereumService } from '../ethereum/ethService';
import { SolanaService } from '../solana/solService';

export class RelayerEngine {
  private ethService: EthereumService;
  private solService: SolanaService;

  constructor(ethService: EthereumService, solService: SolanaService) {
    this.ethService = ethService;
    this.solService = solService;
  }

  public async start(): Promise<void> {
    console.log('[RelayerEngine] Starting cross-chain bridge listeners...');

    // 1. Subscribe to Ethereum Deposits
    this.ethService.listenToDepositEvents(async (depositData) => {
      await this.processDeposit(depositData);
    });

    // 2. Subscribe to Solana Burns
    this.solService.listenToBurnEvents(async (burnData) => {
      await this.processBurn(burnData);
    });
  }

  /**
   * Process Ethereum Deposit -> Solana Mint
   */
  public async processDeposit(depositData: {
    depositId: string;
    user: string;
    amount: string;
    solanaRecipient: string;
    timestamp: number;
    ethTxHash: string;
  }): Promise<void> {
    console.log(`[RelayerEngine] Processing Deposit #${depositData.depositId} from EthTx ${depositData.ethTxHash}...`);

    let depositRecord: IDeposit | null = null;
    try {
      depositRecord = await DepositModel.findOne({ depositId: depositData.depositId });
      if (!depositRecord) {
        depositRecord = new DepositModel({
          depositId: depositData.depositId,
          user: depositData.user,
          amount: depositData.amount,
          solanaRecipient: depositData.solanaRecipient,
          ethTxHash: depositData.ethTxHash,
          status: BridgeStatus.PROCESSING,
          timestamp: depositData.timestamp,
        });
        await depositRecord.save();
      }

      if (depositRecord.status === BridgeStatus.COMPLETED) {
        console.log(`[RelayerEngine] Deposit #${depositData.depositId} already marked COMPLETED. Skipping.`);
        return;
      }

      // Execute mint on Solana
      const solanaTxHash = await this.solService.mintTokensOnSolana(
        depositData.solanaRecipient,
        depositData.amount,
        depositData.ethTxHash,
        depositData.depositId
      );

      depositRecord.solanaTxHash = solanaTxHash;
      depositRecord.status = BridgeStatus.COMPLETED;
      depositRecord.errorMessage = undefined;
      await depositRecord.save();

      console.log(`[RelayerEngine] ✅ Deposit #${depositData.depositId} bridged successfully! SolTx: ${solanaTxHash}`);
    } catch (error: any) {
      console.error(`[RelayerEngine] ❌ Error processing deposit #${depositData.depositId}:`, error.message);
      if (depositRecord) {
        depositRecord.status = BridgeStatus.FAILED;
        depositRecord.errorMessage = error.message;
        depositRecord.retryCount += 1;
        await depositRecord.save();
      }
    }
  }

  /**
   * Process Solana Burn -> Ethereum Unlock
   */
  public async processBurn(burnData: {
    burnId: string;
    solanaUser: string;
    amount: string;
    ethRecipient: string;
    timestamp: number;
    solanaTxHash: string;
  }): Promise<void> {
    console.log(`[RelayerEngine] Processing Burn #${burnData.burnId} from SolTx ${burnData.solanaTxHash}...`);

    let withdrawalRecord: IWithdrawal | null = null;
    try {
      withdrawalRecord = await WithdrawalModel.findOne({ burnId: burnData.burnId });
      if (!withdrawalRecord) {
        withdrawalRecord = new WithdrawalModel({
          burnId: burnData.burnId,
          solanaUser: burnData.solanaUser,
          amount: burnData.amount,
          ethRecipient: burnData.ethRecipient,
          solanaTxHash: burnData.solanaTxHash,
          status: BridgeStatus.PROCESSING,
          timestamp: burnData.timestamp,
        });
        await withdrawalRecord.save();
      }

      if (withdrawalRecord.status === BridgeStatus.COMPLETED) {
        console.log(`[RelayerEngine] Withdrawal #${burnData.burnId} already marked COMPLETED. Skipping.`);
        return;
      }

      // Execute unlock on Ethereum
      const ethTxHash = await this.ethService.unlockTokens(
        burnData.solanaTxHash,
        burnData.ethRecipient,
        burnData.amount
      );

      withdrawalRecord.ethTxHash = ethTxHash;
      withdrawalRecord.status = BridgeStatus.COMPLETED;
      withdrawalRecord.errorMessage = undefined;
      await withdrawalRecord.save();

      console.log(`[RelayerEngine] ✅ Withdrawal #${burnData.burnId} bridged successfully! EthTx: ${ethTxHash}`);
    } catch (error: any) {
      console.error(`[RelayerEngine] ❌ Error processing burn #${burnData.burnId}:`, error.message);
      if (withdrawalRecord) {
        withdrawalRecord.status = BridgeStatus.FAILED;
        withdrawalRecord.errorMessage = error.message;
        withdrawalRecord.retryCount += 1;
        await withdrawalRecord.save();
      }
    }
  }
}
