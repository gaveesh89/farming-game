use anchor_lang::prelude::*;

use crate::constants::PLAYER_SEED;

#[derive(Accounts)]
pub struct ClosePlayer<'info> {
    /// Use UncheckedAccount to avoid deserializing the old account structure
    /// CHECK: We only need to verify the PDA derivation, not the account contents
    #[account(
        mut,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump
    )]
    pub player_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClosePlayer>) -> Result<()> {
    let account = &ctx.accounts.player_account;
    let authority = &ctx.accounts.authority;

    let account_lamports = account.lamports();
    **account.lamports.borrow_mut() = 0;
    **authority.lamports.borrow_mut() = authority
        .lamports()
        .checked_add(account_lamports)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    msg!("Closed player account and transferred {} lamports", account_lamports);
    Ok(())
}
