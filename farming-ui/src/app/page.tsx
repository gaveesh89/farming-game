"use client";

import { useEffect, useState, useCallback } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FarmGrid } from "@/components/FarmGrid";
import AlertBanner from "@/components/AlertBanner";
import { getProgram } from "@/app/utils/program";
import { derivePlayerPDA, createFarmGrid, TileState, CROP_TYPES, FARMING_GAME_PROGRAM_ID } from "@/app/utils/gameHelpers";
import * as anchor from "@coral-xyz/anchor";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [coins, setCoins] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [grid, setGrid] = useState<TileState[][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerPDA, setPlayerPDA] = useState<PublicKey | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Tools: "cursor" (interact/harvest), "wheat", "tomato", "corn", "carrot", "lettuce"
  const [selectedTool, setSelectedTool] = useState<"cursor" | "wheat" | "tomato" | "corn" | "carrot" | "lettuce">("cursor");
  const [mounted, setMounted] = useState(false);
  const [accountDeserializationError, setAccountDeserializationError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive PDA & Fetch SOL Balance
  useEffect(() => {
    if (wallet) {
      const run = async () => {
        try {
          const [pda] = await derivePlayerPDA(wallet.publicKey);
          setPlayerPDA(pda);
          const balance = await connection.getBalance(wallet.publicKey);
          setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (err) {
          console.error("Setup error:", err);
        }
      };
      run();
    } else {
      setPlayerPDA(null);
      setCoins(0);
      setSolBalance(0);
      setGrid(null);
      setAccountExists(false);
    }
  }, [wallet, connection]);

  // Fetch State
  const refreshState = useCallback(async () => {
    if (!wallet || !playerPDA) return;

    try {
      const program = getProgram(connection, wallet);
      // @ts-ignore - IDL typing
      const account = await program.account.playerAccount.fetch(playerPDA);

      setAccountExists(true);
      setAccountDeserializationError(false);
      setCoins(account.coins.toNumber());
      setGrid(createFarmGrid(account.farmTiles as any));

      // Refresh SOL balance too
      const balance = await connection.getBalance(wallet.publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

    } catch (e: any) {
      console.log("Error fetching account:", e);
      
      // Check if account exists on-chain but can't be deserialized
      if (playerPDA && !e.message?.includes("Account does not exist")) {
        const accountInfo = await connection.getAccountInfo(playerPDA);
        if (accountInfo) {
          // Account exists but can't be deserialized - likely old structure
          console.log("⚠️ Account exists but can't be deserialized - old structure detected");
          setAccountExists(false);
          setAccountDeserializationError(true);
          return;
        }
      }
      
      setAccountExists(false);
      setAccountDeserializationError(false);
    }
  }, [connection, wallet, playerPDA]);

  useEffect(() => {
    if (playerPDA) {
      refreshState();
      const interval = setInterval(refreshState, 5000);
      return () => clearInterval(interval);
    }
  }, [playerPDA, refreshState]);

  // Unified Error Handler
  const handleError = (e: any, context: string) => {
    console.error(`${context} error:`, e);
    let msg = "Unknown error";

    if (e.logs) {
      console.log("Transaction Logs:", e.logs);
      msg = "Check console for logs!";
    }

    if (e.message) {
      if (e.message.includes("already been processed")) {
        msg = "Transaction confirmed! Refreshing... ✅";
        // Transaction likely succeeded, just refresh state
        refreshState();
      } else if (e.message.includes("0x1")) msg = "Insufficient Funds 💸";
      else if (e.message.includes("Blockhash not found")) msg = "Network busy, try again...";
      else if (e.message.includes("Simulation failed")) msg = "Simulation failed - check account/params";
      else msg = e.message;
    }

    setTxStatus(`${msg.includes("✅") ? "" : "❌ "}${msg}`);
    if (!msg.includes("confirmed")) {
      alert(`Error in ${context}: ${msg}`);
    }
    setTimeout(() => setTxStatus(null), 3000);
  };

  // Handle Tile Click
  const handleTileClick = (index: number, tile: TileState | null) => {
    if (!tile) return;

    if (tile.cropType === CROP_TYPES.EMPTY) {
      if (selectedTool === "wheat") {
        plant(index, CROP_TYPES.WHEAT);
      } else if (selectedTool === "tomato") {
        plant(index, CROP_TYPES.TOMATO);
      } else if (selectedTool === "corn") {
        plant(index, CROP_TYPES.CORN);
      } else if (selectedTool === "carrot") {
        plant(index, CROP_TYPES.CARROT);
      } else if (selectedTool === "lettuce") {
        plant(index, CROP_TYPES.LETTUCE);
      } else {
        setTxStatus("Select a seed first! 🌱");
        setTimeout(() => setTxStatus(null), 2000);
      }
    } else {
      if (tile.isReady) {
        harvest(index);
      } else {
        setTxStatus(`Wait ${Math.ceil(tile.timeRemaining)}s ⏳`);
        setTimeout(() => setTxStatus(null), 2000);
      }
    }
  };

  // Plant Action
  const plant = async (index: number, cropType: number) => {
    if (!wallet || !playerPDA) return;
    if (loading) return; // Prevent duplicate submissions
    if (solBalance < 0.001) {
      setTxStatus("Needs SOL! 💸");
      alert("You need Devnet SOL to pay for gas! Airdrop some funding.");
      return;
    }

    setLoading(true);
    setTxStatus("Planting... 🌱");
    try {
      const program = getProgram(connection, wallet);
      const tx = await program.methods.plantCrop(index, cropType)
        .accounts({
          playerAccount: playerPDA,
          signer: wallet.publicKey,
        } as any)
        .rpc({ skipPreflight: false });
      
      console.log("Plant TX:", tx);
      setTxStatus("Planted! ✅");
      
      // Wait a bit for state update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshState();
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e: any) {
      handleError(e, "Plant");
    } finally {
      setLoading(false);
    }
  };

  // Harvest Action
  const harvest = async (index: number) => {
    if (!wallet || !playerPDA) return;
    if (loading) return; // Prevent duplicate submissions
    setLoading(true);
    setTxStatus("Harvesting... 🚜");
    try {
      const program = getProgram(connection, wallet);
      const tx = await program.methods.harvestCrop(index)
        .accounts({
          playerAccount: playerPDA,
          signer: wallet.publicKey,
        } as any)
        .rpc({ skipPreflight: false });
      
      console.log("Harvest TX:", tx);
      setTxStatus("Harvested! 💰");
      
      // Wait a bit for state update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshState();
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e: any) {
      handleError(e, "Harvest");
    } finally {
      setLoading(false);
    }
  };

  // Close player account (for resetting after structure changes)
  const closePlayerAccount = async () => {
    if (!wallet || !playerPDA) return;
    
    const confirmClose = confirm(
      "⚠️ This will close your player account and reclaim rent.\n\n" +
      "You will lose all progress (coins, crops, fertility).\n\n" +
      "This is useful when account structure changes.\n\n" +
      "Continue?"
    );
    
    if (!confirmClose) return;

    setLoading(true);
    setTxStatus("Closing Account... 🗑️");
    try {
      const program = getProgram(connection, wallet);
      await program.methods
        .closePlayer()
        .accounts({
          playerAccount: playerPDA,
          signer: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
      setTxStatus("Account Closed! 🎉");
      setAccountExists(false);
      setAccountDeserializationError(false);
      setGrid(null);
      setCoins(0);
      await refreshState();
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e: any) {
      handleError(e, "Close Account");
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  const initializePlayer = async () => {
    if (!wallet || !playerPDA) return;
    if (solBalance < 0.005) {
      alert("You need at least 0.005 SOL to initialize account rent!");
      return;
    }

    setLoading(true);
    setTxStatus("Creating Farm... 🚧");
    try {
      const program = getProgram(connection, wallet);
      await program.methods
        .initializePlayer()
        .accounts({
          playerAccount: playerPDA,
          signer: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
      setTxStatus("Ready! 🏡");
      await refreshState();
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e) {
      handleError(e, "Initialize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-green-50 dark:bg-slate-900 transition-colors relative font-sans">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex lg:flex-row flex-col mb-8">
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
          🌽 Solana Farm
        </h1>
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          {mounted && (
            <WalletMultiButton className="!bg-green-700 hover:!bg-green-600 !transition-colors !rounded-xl !font-bold" />
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center gap-8">
        {wallet ? (
          <>
            {/* Alert Banner - shows actionable notifications */}
            {accountExists && grid && (
              <AlertBanner tiles={grid.flat()} />
            )}

            {/* Status Bar / Coins */}
            <div className="flex w-full gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Balance</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{coins.toLocaleString()} Coins</p>
                </div>
              </div>

              {txStatus && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-1 rounded-full text-sm font-medium animate-fade-in fade-out z-10 whitespace-nowrap">
                  {txStatus}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshState}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Refresh"
                >
                  🔄
                </button>
              </div>
            </div>

            {accountExists ? (
              <>
                {/* Tool Selection */}
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedTool("cursor")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedTool === "cursor"
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    <span>👆</span> Interact
                  </button>
                  <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                  
                  <button
                    onClick={() => setSelectedTool("wheat")}
                    className={`flex flex-col items-start px-3 py-1.5 rounded-lg font-medium transition-all ${selectedTool === "wheat"
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    title="Wheat - Basic crop with moderate fertility cost"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🌾</span> 
                      <span>Wheat</span>
                    </div>
                    <span className="text-[10px] opacity-70">-5 fertility</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedTool("tomato")}
                    className={`flex flex-col items-start px-3 py-1.5 rounded-lg font-medium transition-all ${selectedTool === "tomato"
                      ? "bg-red-100 text-red-800 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    title="Tomato - High yield crop with high fertility cost"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🍅</span>
                      <span>Tomato</span>
                    </div>
                    <span className="text-[10px] opacity-70">-15 fertility</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedTool("corn")}
                    className={`flex flex-col items-start px-3 py-1.5 rounded-lg font-medium transition-all ${selectedTool === "corn"
                      ? "bg-yellow-100 text-yellow-800 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    title="Corn - Standard crop with moderate fertility cost"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🌽</span>
                      <span>Corn</span>
                    </div>
                    <span className="text-[10px] opacity-70">-10 fertility</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedTool("carrot")}
                    className={`flex flex-col items-start px-3 py-1.5 rounded-lg font-medium transition-all ${selectedTool === "carrot"
                      ? "bg-orange-100 text-orange-800 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    title="Carrot - Restorative crop that restores soil fertility!"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🥕</span>
                      <span>Carrot</span>
                    </div>
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">+10 fertility ♻️</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedTool("lettuce")}
                    className={`flex flex-col items-start px-3 py-1.5 rounded-lg font-medium transition-all ${selectedTool === "lettuce"
                      ? "bg-green-100 text-green-800 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    title="Lettuce - Restorative crop that restores soil fertility!"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🥬</span>
                      <span>Lettuce</span>
                    </div>
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">+10 fertility ♻️</span>
                  </button>
                </div>

                <div className={loading ? "opacity-70 transition-opacity" : "transition-opacity"}>
                  <FarmGrid grid={grid} onTileClick={handleTileClick} />
                </div>

                {/* Tips & Help Section */}
                <div className="w-full max-w-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-sm space-y-2">
                    <div className="font-bold text-blue-900 dark:text-blue-300 mb-2">🎯 Quick Tips:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex gap-2">
                        <span>✨</span>
                        <span>Harvest within the optimal window for maximum yield</span>
                      </div>
                      <div className="flex gap-2">
                        <span>♻️</span>
                        <span>Rotate crops for +10 fertility bonus</span>
                      </div>
                      <div className="flex gap-2">
                        <span>🌱</span>
                        <span>Use Carrot/Lettuce to restore depleted soil</span>
                      </div>
                      <div className="flex gap-2">
                        <span>📊</span>
                        <span>Hover tiles to see detailed yield predictions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-12 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-4 border-double border-green-200 dark:border-green-800 backdrop-blur-sm shadow-xl">
                <div className="text-6xl mb-4">🚜</div>
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-2">
                  Welcome Farmer!
                </h2>
                <p className="text-green-700 dark:text-green-500 mb-6">
                  Your land is waiting. Initialize your farm to begin.
                </p>
                <button
                  onClick={initializePlayer}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all font-bold shadow-lg transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center gap-2 mx-auto"
                >
                  {loading ? "Constructing..." : "Initialize Farm ✨"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-xl backdrop-blur-md border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Connect Wallet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-xs">
              Connect your Solana wallet to manage your farm and earn rewards.
            </p>
            {mounted && (
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-500 !py-3 !px-6 !h-auto !text-base shadow-lg hover:shadow-purple-500/30 transition-all font-bold" />
            )}
          </div>
        )}
      </div>

      {/* Debug Panel */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
        >
          {showDebug ? "Hide Debug" : "Show Debug 🛠️"}
        </button>

        {showDebug && (
          <div className="mt-2 p-4 bg-black/90 text-green-400 font-mono text-xs rounded-lg shadow-2xl max-w-md break-all border border-gray-700">
            <p className="mb-2 font-bold text-white border-b border-gray-700 pb-1">🔧 Debug Panel (Devnet)</p>
            <p><span className="text-gray-500">Endpoint:</span> {connection.rpcEndpoint}</p>
            <p><span className="text-gray-500">Cluster:</span> Devnet</p>
            <p><span className="text-gray-500">Status:</span> {wallet ? "Connected" : "Disconnected"}</p>
            {wallet && (
              <>
                <p className="mt-2"><span className="text-gray-500">Wallet:</span> {wallet.publicKey.toString()}</p>
                <p><span className="text-gray-500">SOL Balance:</span> {solBalance.toFixed(4)} SOL</p>
                <p className="mt-2"><span className="text-gray-500">Program ID:</span> {FARMING_GAME_PROGRAM_ID.toString()}</p>
                <p><span className="text-gray-500">Player PDA:</span> {playerPDA?.toString() || "Not derived"}</p>
                <p><span className="text-gray-500">Account Exists:</span> {accountExists ? "YES" : "NO"}</p>
                {accountDeserializationError && (
                  <p className="text-orange-400 text-[10px] mt-1">⚠️ Old account structure detected</p>
                )}
                
                {/* Close Account Button - useful for testing/resetting */}
                {(accountExists || accountDeserializationError) && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <button
                      onClick={closePlayerAccount}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white text-xs rounded transition-colors font-bold"
                    >
                      🗑️ Close Account (Reset)
                    </button>
                    <p className="text-gray-500 text-[10px] mt-1">
                      {accountDeserializationError ? "Close old account to fix structure" : "Use if account structure changed"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
