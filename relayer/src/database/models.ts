import mongoose, { Schema, Document } from 'mongoose';

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

export interface IDeposit extends Document {
  depositId: string;
  user: string;
  amount: string;
  solanaRecipient: string;
  ethTxHash: string;
  solanaTxHash?: string;
  status: BridgeStatus;
  retryCount: number;
  errorMessage?: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWithdrawal extends Document {
  burnId: string;
  solanaUser: string;
  amount: string;
  ethRecipient: string;
  solanaTxHash: string;
  ethTxHash?: string;
  status: BridgeStatus;
  retryCount: number;
  errorMessage?: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProcessedEvent extends Document {
  eventId: string;
  chain: string;
  txHash: string;
  processedAt: Date;
}

const DepositSchema = new Schema<IDeposit>(
  {
    depositId: { type: String, required: true, unique: true, index: true },
    user: { type: String, required: true },
    amount: { type: String, required: true },
    solanaRecipient: { type: String, required: true },
    ethTxHash: { type: String, required: true, index: true },
    solanaTxHash: { type: String },
    status: { type: String, enum: Object.values(BridgeStatus), default: BridgeStatus.PENDING },
    retryCount: { type: Number, default: 0 },
    errorMessage: { type: String },
    timestamp: { type: Number, required: true },
  },
  { timestamps: true }
);

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    burnId: { type: String, required: true, unique: true, index: true },
    solanaUser: { type: String, required: true },
    amount: { type: String, required: true },
    ethRecipient: { type: String, required: true },
    solanaTxHash: { type: String, required: true, index: true },
    ethTxHash: { type: String },
    status: { type: String, enum: Object.values(BridgeStatus), default: BridgeStatus.PENDING },
    retryCount: { type: Number, default: 0 },
    errorMessage: { type: String },
    timestamp: { type: Number, required: true },
  },
  { timestamps: true }
);

const ProcessedEventSchema = new Schema<IProcessedEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    chain: { type: String, required: true },
    txHash: { type: String, required: true },
    processedAt: { type: Date, default: Date.now }
  }
);

export const DepositModel = mongoose.model<IDeposit>('Deposit', DepositSchema);
export const WithdrawalModel = mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);
export const ProcessedEventModel = mongoose.model<IProcessedEvent>('ProcessedEvent', ProcessedEventSchema);
