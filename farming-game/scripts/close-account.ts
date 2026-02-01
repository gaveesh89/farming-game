/**
 * Script to close an old player account that has incompatible structure
 * This allows re-initialization with the new account structure
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from "fs";

async function main() {
  // Set up connection and wallet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load wallet
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("../deploy-wallet.json", "utf-8")))
  );
  
  const programId = new anchor.web3.PublicKey("8NND7mQn5q7UQcrVrzrQfsHwYruqnQshMjFuwq4WBaHR");
  
  // Derive PDA
  const [playerPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("player"), walletKeypair.publicKey.toBuffer()],
    programId
  );
  
  console.log("Wallet:", walletKeypair.publicKey.toString());
  console.log("Player PDA:", playerPDA.toString());
  
  // Check if account exists
  const accountInfo = await connection.getAccountInfo(playerPDA);
  
  if (!accountInfo) {
    console.log("✅ Account doesn't exist - nothing to close");
    return;
  }
  
  console.log(`Account exists with ${accountInfo.data.length} bytes`);
  console.log(`Rent: ${accountInfo.lamports / 1e9} SOL`);
  
  // Close account by transferring lamports to wallet and zeroing data
  // This is a workaround since the program doesn't have a close instruction
  const instruction = new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: playerPDA, isSigner: false, isWritable: true },
      { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: programId,
    data: Buffer.from([]), // Empty instruction
  });
  
  console.log("\n⚠️  Cannot close account without a close instruction in the program.");
  console.log("📝 Options:");
  console.log("   1. Use a different wallet (new PDA will be created)");
  console.log("   2. Add a close_player instruction to the program");
  console.log("   3. Continue using the account if you rebuild with correct structure");
  console.log("\n💡 Recommended: Test with a new wallet or add close instruction to program");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
