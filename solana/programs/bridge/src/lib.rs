use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount};

declare_id!("Br1dge1111111111111111111111111111111111111");

#[program]
pub mod bridge {
    use super::*;

    /// Initialize the Bridge state and create the SPL Token Mint PDA
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let bridge_state = &mut ctx.accounts.bridge_state;
        bridge_state.authority = ctx.accounts.authority.key();
        bridge_state.mint = ctx.accounts.mint.key();
        bridge_state.mint_bump = ctx.bumps.mint;
        bridge_state.total_minted = 0;
        bridge_state.total_burned = 0;

        msg!("Bridge initialized successfully!");
        Ok(())
    }

    /// Mint SPL tokens to user wallet when Ethereum deposit event is verified by relayer
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
        eth_tx_hash: [u8; 32],
        deposit_id: u64,
    ) -> Result<()> {
        let bridge_state = &mut ctx.accounts.bridge_state;

        // Record processed Ethereum transaction PDA to guarantee replay protection
        let processed_tx = &mut ctx.accounts.processed_eth_tx;
        processed_tx.eth_tx_hash = eth_tx_hash;
        processed_tx.deposit_id = deposit_id;
        processed_tx.processed_at = Clock::get()?.unix_timestamp;
        processed_tx.bump = ctx.bumps.processed_eth_tx;

        // Update bridge state total minted
        bridge_state.total_minted = bridge_state.total_minted.checked_add(amount).unwrap();

        // Mint SPL tokens to recipient ATA using Bridge PDA signer seeds
        let seeds = &[
            b"mint".as_ref(),
            &[bridge_state.mint_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.mint.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::mint_to(cpi_ctx, amount)?;

        emit!(TokensMinted {
            deposit_id,
            eth_tx_hash,
            recipient: ctx.accounts.user_token_account.owner,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Minted {} SPL tokens for Ethereum deposit ID {}", amount, deposit_id);
        Ok(())
    }

    /// Burn SPL tokens to unlock ERC-20 tokens on Ethereum
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
        eth_recipient: [u8; 20],
    ) -> Result<()> {
        let bridge_state = &mut ctx.accounts.bridge_state;

        // Burn SPL tokens from user's account
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount)?;

        // Update bridge state total burned
        bridge_state.total_burned = bridge_state.total_burned.checked_add(amount).unwrap();

        emit!(TokensBurned {
            user: ctx.accounts.user.key(),
            amount,
            eth_recipient,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Burned {} SPL tokens for Ethereum recipient {:?}", amount, eth_recipient);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + BridgeState::INIT_SPACE,
        seeds = [b"bridge_state"],
        bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        init,
        payer = authority,
        seeds = [b"mint"],
        bump,
        mint::decimals = 9,
        mint::authority = mint,
        mint::freeze_authority = mint
    )]
    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, eth_tx_hash: [u8; 32], deposit_id: u64)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bridge_state"],
        bump,
        has_one = authority @ BridgeError::UnauthorizedRelayer
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        mut,
        seeds = [b"mint"],
        bump = bridge_state.mint_bump
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProcessedEthTx::INIT_SPACE,
        seeds = [b"processed_eth_tx", eth_tx_hash.as_ref()],
        bump
    )]
    pub processed_eth_tx: Account<'info, ProcessedEthTx>,

    #[account(
        mut,
        constraint = user_token_account.mint == mint.key() @ BridgeError::InvalidMint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bridge_state"],
        bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        mut,
        seeds = [b"mint"],
        bump = bridge_state.mint_bump
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_token_account.mint == mint.key() @ BridgeError::InvalidMint,
        constraint = user_token_account.owner == user.key() @ BridgeError::InvalidOwner
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct BridgeState {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub mint_bump: u8,
    pub total_minted: u64,
    pub total_burned: u64,
}

#[account]
#[derive(InitSpace)]
pub struct ProcessedEthTx {
    pub eth_tx_hash: [u8; 32],
    pub deposit_id: u64,
    pub processed_at: i64,
    pub bump: u8,
}

#[event]
pub struct TokensMinted {
    pub deposit_id: u64,
    pub eth_tx_hash: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensBurned {
    pub user: Pubkey,
    pub amount: u64,
    pub eth_recipient: [u8; 20],
    pub timestamp: i64,
}

#[error_code]
pub enum BridgeError {
    #[msg("Unauthorized relayer authority")]
    UnauthorizedRelayer,
    #[msg("Invalid token mint account")]
    InvalidMint,
    #[msg("Invalid token account owner")]
    InvalidOwner,
}
