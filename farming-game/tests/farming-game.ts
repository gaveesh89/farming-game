import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FarmingGame } from "../target/types/farming_game";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("farming-game", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FarmingGame as Program<FarmingGame>;
  const player = provider.wallet.publicKey;

  // Derive the player account PDA
  const [playerPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("player"), player.toBuffer()],
    program.programId
  );

  // Crop type constants
  const CROP_WHEAT = 1;
  const CROP_CORN = 2;

  describe("initialize_player", () => {
    it("Creates PDA and sets default values", async () => {
      // Initialize player account
      await program.methods
        .initializePlayer()
        .accounts({
          playerAccount: playerPDA,
          signer: player,
          owner: player,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Fetch the account data
      const playerAccount = await program.account.playerAccount.fetch(playerPDA);

      // Verify defaults
      assert.equal(playerAccount.owner.toString(), player.toString());
      assert.equal(playerAccount.coins.toNumber(), 0);
      assert.equal(playerAccount.farmTiles.length, 25);

      // Verify all tiles are empty
      playerAccount.farmTiles.forEach((tile, index) => {
        assert.equal(tile.cropType, 0, `Tile ${index} should be empty`);
        assert.equal(tile.plantedAt.toNumber(), 0, `Tile ${index} planted_at should be 0`);
      });

      console.log("✅ Player account initialized successfully");
      console.log(`   Owner: ${playerAccount.owner}`);
      console.log(`   Coins: ${playerAccount.coins}`);
      console.log(`   Tiles: ${playerAccount.farmTiles.length}`);
    });
  });

  describe("plant", () => {
    it("Updates the correct tile with crop data", async () => {
      const tileIndex = 0;

      // Plant wheat on tile 0
      await program.methods
        .plant(tileIndex, CROP_WHEAT)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      // Fetch updated account
      const playerAccount = await program.account.playerAccount.fetch(playerPDA);
      const tile = playerAccount.farmTiles[tileIndex];

      // Verify tile was updated
      assert.equal(tile.cropType, CROP_WHEAT);
      assert.isAbove(tile.plantedAt.toNumber(), 0, "planted_at should be set");

      console.log("✅ Planted wheat on tile 0");
      console.log(`   Crop type: ${tile.cropType}`);
      console.log(`   Planted at: ${tile.plantedAt}`);
    });

    it("Fails when planting on same tile twice (TileNotEmpty)", async () => {
      const tileIndex = 0; // Already has wheat from previous test

      try {
        await program.methods
          .plant(tileIndex, CROP_CORN)
          .accounts({
            playerAccount: playerPDA,
            owner: player,
            signer: player,
          })
          .rpc();

        assert.fail("Should have thrown TileNotEmpty error");
      } catch (error) {
        assert.include(error.toString(), "TileNotEmpty");
        console.log("✅ Correctly rejected planting on occupied tile");
      }
    });

    it("Plants corn on a different tile", async () => {
      const tileIndex = 5;

      // Plant corn on tile 5
      await program.methods
        .plant(tileIndex, CROP_CORN)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      // Fetch updated account
      const playerAccount = await program.account.playerAccount.fetch(playerPDA);
      const tile = playerAccount.farmTiles[tileIndex];

      // Verify tile was updated
      assert.equal(tile.cropType, CROP_CORN);
      assert.isAbove(tile.plantedAt.toNumber(), 0);

      console.log("✅ Planted corn on tile 5");
    });
  });

  describe("harvest", () => {
    it("Fails when harvesting before crop is ready (CropNotReady)", async () => {
      const tileIndex = 0; // Has wheat (30 second growth time)

      try {
        await program.methods
          .harvest(tileIndex)
          .accounts({
            playerAccount: playerPDA,
            owner: player,
            signer: player,
          })
          .rpc();

        assert.fail("Should have thrown CropNotReady error");
      } catch (error) {
        assert.include(error.toString(), "CropNotReady");
        console.log("✅ Correctly rejected early harvest");
      }
    });

    it("Successfully harvests wheat after waiting 30+ seconds", async () => {
      const tileIndex = 0; // Has wheat
      const WHEAT_GROWTH_TIME = 30; // seconds
      const WHEAT_REWARD = 1; // coins

      console.log(`⏳ Waiting ${WHEAT_GROWTH_TIME} seconds for wheat to grow...`);
      
      // Wait for wheat to grow
      await new Promise(resolve => setTimeout(resolve, WHEAT_GROWTH_TIME * 1000));

      // Get coins before harvest
      const beforeAccount = await program.account.playerAccount.fetch(playerPDA);
      const coinsBefore = beforeAccount.coins.toNumber();

      // Harvest wheat
      await program.methods
        .harvest(tileIndex)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      // Fetch updated account
      const afterAccount = await program.account.playerAccount.fetch(playerPDA);
      const tile = afterAccount.farmTiles[tileIndex];
      const coinsAfter = afterAccount.coins.toNumber();

      // Verify tile was cleared
      assert.equal(tile.cropType, 0, "Tile should be empty after harvest");
      assert.equal(tile.plantedAt.toNumber(), 0, "planted_at should be reset");

      // Verify coins increased
      assert.equal(coinsAfter, coinsBefore + WHEAT_REWARD, "Should earn 1 coin for wheat");

      console.log("✅ Successfully harvested wheat");
      console.log(`   Coins before: ${coinsBefore}`);
      console.log(`   Coins after: ${coinsAfter}`);
      console.log(`   Reward: ${WHEAT_REWARD}`);
    });

    it("Successfully harvests corn after waiting 60+ seconds", async () => {
      const tileIndex = 5; // Has corn
      const CORN_GROWTH_TIME = 60; // seconds
      const CORN_REWARD = 2; // coins

      console.log(`⏳ Waiting ${CORN_GROWTH_TIME} seconds for corn to grow...`);
      
      // Wait for corn to grow
      await new Promise(resolve => setTimeout(resolve, CORN_GROWTH_TIME * 1000));

      // Get coins before harvest
      const beforeAccount = await program.account.playerAccount.fetch(playerPDA);
      const coinsBefore = beforeAccount.coins.toNumber();

      // Harvest corn
      await program.methods
        .harvest(tileIndex)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      // Fetch updated account
      const afterAccount = await program.account.playerAccount.fetch(playerPDA);
      const tile = afterAccount.farmTiles[tileIndex];
      const coinsAfter = afterAccount.coins.toNumber();

      // Verify tile was cleared
      assert.equal(tile.cropType, 0, "Tile should be empty after harvest");
      assert.equal(tile.plantedAt.toNumber(), 0, "planted_at should be reset");

      // Verify coins increased
      assert.equal(coinsAfter, coinsBefore + CORN_REWARD, "Should earn 2 coins for corn");

      console.log("✅ Successfully harvested corn");
      console.log(`   Coins before: ${coinsBefore}`);
      console.log(`   Coins after: ${coinsAfter}`);
      console.log(`   Reward: ${CORN_REWARD}`);
    });

    it("Fails when trying to harvest empty tile (TileEmpty)", async () => {
      const tileIndex = 10; // Empty tile

      try {
        await program.methods
          .harvest(tileIndex)
          .accounts({
            playerAccount: playerPDA,
            owner: player,
            signer: player,
          })
          .rpc();

        assert.fail("Should have thrown TileEmpty error");
      } catch (error) {
        assert.include(error.toString(), "TileEmpty");
        console.log("✅ Correctly rejected harvesting empty tile");
      }
    });
  });

  describe("Full farming cycle", () => {
    it("Can plant and harvest multiple times on same tile", async () => {
      const tileIndex = 15;
      const WHEAT_GROWTH_TIME = 30;
      const WHEAT_REWARD = 1;

      // Get initial coins
      let account = await program.account.playerAccount.fetch(playerPDA);
      const initialCoins = account.coins.toNumber();

      // First cycle: Plant wheat
      await program.methods
        .plant(tileIndex, CROP_WHEAT)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      console.log("⏳ Waiting for first wheat crop...");
      await new Promise(resolve => setTimeout(resolve, WHEAT_GROWTH_TIME * 1000));

      // Harvest first wheat
      await program.methods
        .harvest(tileIndex)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      // Second cycle: Plant wheat again on same tile
      await program.methods
        .plant(tileIndex, CROP_WHEAT)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      console.log("⏳ Waiting for second wheat crop...");
      await new Promise(resolve => setTimeout(resolve, WHEAT_GROWTH_TIME * 1000));

      // Harvest second wheat
      await program.methods
        .harvest(tileIndex)
        .accounts({
          playerAccount: playerPDA,
          owner: player,
          signer: player,
        })
        .rpc();

      // Verify we earned 2 wheat rewards
      account = await program.account.playerAccount.fetch(playerPDA);
      const finalCoins = account.coins.toNumber();
      const expectedCoins = initialCoins + (WHEAT_REWARD * 2);

      assert.equal(finalCoins, expectedCoins, "Should have earned 2 wheat rewards");

      console.log("✅ Successfully completed two farming cycles");
      console.log(`   Initial coins: ${initialCoins}`);
      console.log(`   Final coins: ${finalCoins}`);
      console.log(`   Total earned: ${finalCoins - initialCoins}`);
    });
  });
});
