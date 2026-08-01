import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { expect } from "chai";

describe("bridge", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Bridge as Program<Bridge>;

  const [bridgeStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bridge_state")],
    program.programId
  );

  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  const user = anchor.web3.Keypair.generate();
  const ethTxHash = Array.from(Buffer.alloc(32, 1)); // Mock 32-byte ETH Tx hash
  const depositId = new anchor.BN(1);
  const mintAmount = new anchor.BN(1_000_000_000); // 1 Token with 9 decimals

  before(async () => {
    // Airdrop SOL to user for rent
    const tx = await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(tx);
  });

  it("Initializes the Bridge state and Mint PDA", async () => {
    await program.methods
      .initialize()
      .accounts({
        authority: provider.wallet.publicKey,
        bridgeState: bridgeStatePda,
        mint: mintPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const state = await program.account.bridgeState.fetch(bridgeStatePda);
    expect(state.authority.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(state.mint.toBase58()).to.equal(mintPda.toBase58());
  });

  it("Mints SPL tokens to user ATA", async () => {
    const userAta = await getAssociatedTokenAddress(mintPda, user.publicKey);

    // Create ATA for user
    const createAtaTx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        userAta,
        user.publicKey,
        mintPda
      )
    );
    await provider.sendAndConfirm(createAtaTx);

    const [processedEthTxPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("processed_eth_tx"), Buffer.from(ethTxHash)],
      program.programId
    );

    await program.methods
      .mintTokens(mintAmount, ethTxHash, depositId)
      .accounts({
        authority: provider.wallet.publicKey,
        bridgeState: bridgeStatePda,
        mint: mintPda,
        processedEthTx: processedEthTxPda,
        userTokenAccount: userAta,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const userTokenBalance = await provider.connection.getTokenAccountBalance(userAta);
    expect(userTokenBalance.value.amount).to.equal(mintAmount.toString());
  });

  it("Burns SPL tokens to release Ethereum locked tokens", async () => {
    const userAta = await getAssociatedTokenAddress(mintPda, user.publicKey);
    const ethRecipient = Array.from(Buffer.alloc(20, 2)); // Mock ETH recipient address (20 bytes)

    await program.methods
      .burnTokens(mintAmount, ethRecipient)
      .accounts({
        user: user.publicKey,
        bridgeState: bridgeStatePda,
        mint: mintPda,
        userTokenAccount: userAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const userTokenBalance = await provider.connection.getTokenAccountBalance(userAta);
    expect(userTokenBalance.value.amount).to.equal("0");
  });
});
