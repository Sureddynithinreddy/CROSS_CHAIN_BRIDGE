import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { config } from '../config';
import bs58 from 'bs58';
import { ethers } from 'ethers';

const BRIDGE_PROGRAM_ID = new PublicKey(config.solana.programId);

export class SolanaService {
  private connection: Connection;
  private relayerKeypair: Keypair;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');

    if (config.solana.relayerKeypairJson) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(config.solana.relayerKeypairJson));
        this.relayerKeypair = Keypair.fromSecretKey(secretKey);
      } catch {
        this.relayerKeypair = Keypair.generate();
      }
    } else {
      this.relayerKeypair = Keypair.generate();
    }
  }

  public getRelayerPublicKey(): string {
    return this.relayerKeypair.publicKey.toBase58();
  }

  public getConnection(): Connection {
    return this.connection;
  }

  /**
   * Listen for TokensBurned events on Solana Anchor program logs
   */
  public listenToBurnEvents(onBurn: (burnData: {
    burnId: string;
    solanaUser: string;
    amount: string;
    ethRecipient: string;
    timestamp: number;
    solanaTxHash: string;
  }) => void): void {
    console.log(`[SolanaService] Subscribing to program logs for ${BRIDGE_PROGRAM_ID.toBase58()}...`);

    this.connection.onLogs(BRIDGE_PROGRAM_ID, (logsCtx, ctx) => {
      if (logsCtx.err) return;

      for (const log of logsCtx.logs) {
        if (log.includes("TokensBurned") || log.includes("Burned")) {
          console.log(`[Solana] Program Log Detected: ${log}`);
          
          // Parse event log
          // Log format: "Program log: Burned <amount> SPL tokens for Ethereum recipient <address>"
          const match = log.match(/Burned (\d+) SPL tokens/);
          if (match) {
            const amount = match[1];
            onBurn({
              burnId: logsCtx.signature,
              solanaUser: "SolanaUser",
              amount: amount,
              ethRecipient: ethers.ZeroAddress, // Extracted from program event in detailed IDL parser
              timestamp: Math.floor(Date.now() / 1000),
              solanaTxHash: logsCtx.signature
            });
          }
        }
      }
    }, 'confirmed');
  }

  /**
   * Mint SPL tokens on Solana when Ethereum deposit event is received
   */
  public async mintTokensOnSolana(
    recipientBase58: string,
    amountWei: string,
    ethTxHash: string,
    depositId: string
  ): Promise<string> {
    console.log(`[SolanaService] Minting tokens on Solana. Recipient=${recipientBase58}, Amount=${amountWei}, EthTx=${ethTxHash}, DepositID=${depositId}`);

    const recipientPubkey = new PublicKey(recipientBase58);

    // Derive PDAs
    const [bridgeStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bridge_state")],
      BRIDGE_PROGRAM_ID
    );

    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      BRIDGE_PROGRAM_ID
    );

    // Convert ethTxHash (0x...) to 32 byte array
    const ethTxHashBytes = Buffer.from(ethTxHash.replace("0x", ""), "hex");
    const formatted32ByteHash = Buffer.alloc(32);
    ethTxHashBytes.copy(formatted32ByteHash, 0, 0, Math.min(32, ethTxHashBytes.length));

    const [processedEthTxPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("processed_eth_tx"), formatted32ByteHash],
      BRIDGE_PROGRAM_ID
    );

    const userAta = await getAssociatedTokenAddress(mintPda, recipientPubkey);

    const tx = new Transaction();

    // Check if ATA exists, create if not
    const ataInfo = await this.connection.getAccountInfo(userAta);
    if (!ataInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          this.relayerKeypair.publicKey,
          userAta,
          recipientPubkey,
          mintPda
        )
      );
    }

    // Convert wei amount (18 decimals) to SPL decimals (9 decimals)
    // 1 ETH (10^18) = 1 SPL (10^9) -> Divide by 10^9
    const amountBn = new anchor.BN(amountWei).div(new anchor.BN(10).pow(new anchor.BN(9)));

    // Anchor Instruction Layout for mint_tokens
    // Discriminator for mint_tokens: sha256("global:mint_tokens")[..8]
    const discriminator = Buffer.from([123, 203, 114, 155, 62, 19, 137, 246]); // Placeholder Anchor discriminator
    
    // Construct transaction instruction
    const data = Buffer.concat([
      discriminator,
      amountBn.toArrayLike(Buffer, 'le', 8),
      formatted32ByteHash,
      new anchor.BN(depositId).toArrayLike(Buffer, 'le', 8)
    ]);

    const keys = [
      { pubkey: this.relayerKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: bridgeStatePda, isSigner: false, isWritable: true },
      { pubkey: mintPda, isSigner: false, isWritable: true },
      { pubkey: processedEthTxPda, isSigner: false, isWritable: true },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    tx.add({
      keys,
      programId: BRIDGE_PROGRAM_ID,
      data
    });

    const signature = await this.connection.sendTransaction(tx, [this.relayerKeypair], {
      skipPreflight: true
    });

    console.log(`[SolanaService] Mint Tx submitted: ${signature}.`);
    return signature;
  }
}
