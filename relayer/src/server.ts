import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDB } from './database/db';
import { DepositModel, WithdrawalModel, BridgeStatus } from './database/models';
import { EthereumService } from './ethereum/ethService';
import { SolanaService } from './solana/solService';
import { RelayerEngine } from './services/relayerEngine';

const app = express();
app.use(cors());
app.use(express.json());

const ethService = new EthereumService();
const solService = new SolanaService();
const relayerEngine = new RelayerEngine(ethService, solService);

// Health check & status
app.get('/api/status', async (req: Request, res: Response) => {
  const ethRelayer = ethService.getRelayerAddress();
  const solRelayer = solService.getRelayerPublicKey();
  const lockedEth = await ethService.getLockedBalance();

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    relayerAddresses: {
      ethereum: ethRelayer,
      solana: solRelayer
    },
    lockedEthBalanceWei: lockedEth,
    config: {
      ethereumRpc: config.ethereum.rpcUrl,
      solanaRpc: config.solana.rpcUrl,
      ethBridgeAddress: config.ethereum.bridgeAddress,
      solanaProgramId: config.solana.programId
    }
  });
});

// Transaction history (deposits + withdrawals)
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const deposits = await DepositModel.find().sort({ createdAt: -1 }).limit(20);
    const withdrawals = await WithdrawalModel.find().sort({ createdAt: -1 }).limit(20);

    const formattedDeposits = deposits.map(d => ({
      id: d.depositId,
      direction: 'ETH_TO_SOL',
      sender: d.user,
      recipient: d.solanaRecipient,
      amount: d.amount,
      sourceTxHash: d.ethTxHash,
      destinationTxHash: d.solanaTxHash,
      status: d.status,
      errorMessage: d.errorMessage,
      createdAt: d.createdAt
    }));

    const formattedWithdrawals = withdrawals.map(w => ({
      id: w.burnId,
      direction: 'SOL_TO_ETH',
      sender: w.solanaUser,
      recipient: w.ethRecipient,
      amount: w.amount,
      sourceTxHash: w.solanaTxHash,
      destinationTxHash: w.ethTxHash,
      status: w.status,
      errorMessage: w.errorMessage,
      createdAt: w.createdAt
    }));

    const combinedHistory = [...formattedDeposits, ...formattedWithdrawals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ success: true, history: combinedHistory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bridge stats
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const totalDeposits = await DepositModel.countDocuments();
    const completedDeposits = await DepositModel.countDocuments({ status: BridgeStatus.COMPLETED });
    const totalWithdrawals = await WithdrawalModel.countDocuments();
    const completedWithdrawals = await WithdrawalModel.countDocuments({ status: BridgeStatus.COMPLETED });

    res.json({
      success: true,
      stats: {
        totalTransactionsCount: totalDeposits + totalWithdrawals,
        completedTransactionsCount: completedDeposits + completedWithdrawals,
        pendingTransactionsCount: (totalDeposits + totalWithdrawals) - (completedDeposits + completedWithdrawals),
        totalEthDeposits: totalDeposits,
        totalSolBurned: totalWithdrawals
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual trigger / simulation endpoint for dev testing
app.post('/api/bridge/deposit', async (req: Request, res: Response) => {
  const { depositId, user, amount, solanaRecipient, ethTxHash } = req.body;
  
  if (!depositId || !user || !amount || !solanaRecipient || !ethTxHash) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  // Trigger deposit process in background engine
  relayerEngine.processDeposit({
    depositId: depositId.toString(),
    user,
    amount: amount.toString(),
    solanaRecipient,
    timestamp: Math.floor(Date.now() / 1000),
    ethTxHash
  }).catch(console.error);

  res.json({ success: true, message: `Deposit #${depositId} queued for bridging.` });
});

app.post('/api/bridge/burn', async (req: Request, res: Response) => {
  const { burnId, solanaUser, amount, ethRecipient, solanaTxHash } = req.body;

  if (!burnId || !solanaUser || !amount || !ethRecipient || !solanaTxHash) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  // Trigger burn process in background engine
  relayerEngine.processBurn({
    burnId: burnId.toString(),
    solanaUser,
    amount: amount.toString(),
    ethRecipient,
    timestamp: Math.floor(Date.now() / 1000),
    solanaTxHash
  }).catch(console.error);

  res.json({ success: true, message: `Burn #${burnId} queued for unlocking on Ethereum.` });
});

async function startServer() {
  await connectDB();
  await relayerEngine.start();

  app.listen(config.port, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Bridge Relayer API Server running on port ${config.port}`);
    console.log(`   Ethereum Relayer: ${ethService.getRelayerAddress()}`);
    console.log(`   Solana Relayer:   ${solService.getRelayerPublicKey()}`);
    console.log(`==================================================\n`);
  });
}

startServer().catch(console.error);
