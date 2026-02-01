#!/usr/bin/env node

/**
 * Close the old player account that has incompatible structure
 */
const anchor = require("@coral-xyz/anchor");
const { Connection, Keypair } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("./deploy-wallet.json", "utf-8")))
  );

  // Load IDL
  const idl = JSON.parse(fs.readFileSync("./target/idl/farming_game.json", "utf-8"));
  
  const programId = new anchor.web3.PublicKey("8NND7mQn5q7UQcrVrzrQfsHwYruqnQshMjFuwq4WBaHR");
  
  // Create provider
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(walletKeypair),
    { commitment: "confirmed" }
  );

  // Create program instance
  const program = new anchor.Program(idl, programId, provider);
  
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
  
  console.log(`Account exists with ${accountInfo.data.length} bytes (old size: 273, new size: 323)`);
  console.log(`Rent: ${accountInfo.lamports / 1e9} SOL`);
  
  try {
    console.log("\n🔄 Calling closePlayer instruction...");
    
    const tx = await program.methods
      .closePlayer()
      .accounts({
        playerAccount: playerPDA,
        signer: walletKeypair.publicKey,
      })
      .transaction();
    
    const signature = await connection.sendTransaction(tx, [walletKeypair]);
    
    console.log("✅ Close transaction signature:", signature);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");
    console.log("✅ Transaction confirmed!");
    
    // Verify account is closed
    const newAccountInfo = await connection.getAccountInfo(playerPDA);
    if (newAccountInfo === null) {
      console.log("✅ Account successfully closed! You can now reinitialize.");
    } else {
      console.log("⚠️ Account still exists, but close instruction was called");
    }
    
  } catch (error) {
    console.error("❌ Error closing account:", error.message);
    if (error.logs) {
      console.log("\nProgram Logs:");
      error.logs.forEach(log => console.log("  " + log));
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
