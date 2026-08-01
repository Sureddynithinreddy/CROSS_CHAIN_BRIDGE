export enum BridgeStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum BridgeDirection {
  ETH_TO_SOL = 'ETH_TO_SOL',
  SOL_TO_ETH = 'SOL_TO_ETH'
}

export interface DepositEventData {
  depositId: string;
  user: string;
  amount: string;
  solanaRecipient: string;
  timestamp: number;
  ethTxHash: string;
  blockNumber: number;
}

export interface BurnEventData {
  burnId: string;
  user: string;
  amount: string;
  ethRecipient: string;
  timestamp: number;
  solanaTxHash: string;
  slotNumber: number;
}

export interface BridgeTransaction {
  id: string;
  direction: BridgeDirection;
  sender: string;
  recipient: string;
  amount: string;
  sourceTxHash: string;
  destinationTxHash?: string;
  status: BridgeStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BridgeStats {
  totalEthLocked: string;
  totalSolMinted: string;
  totalSolBurned: string;
  totalEthUnlocked: string;
  totalTransactionsCount: number;
  completedTransactionsCount: number;
  pendingTransactionsCount: number;
}
