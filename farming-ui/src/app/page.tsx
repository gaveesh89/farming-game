"use client";

import { useEffect, useState, useCallback } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FarmGrid } from "@/components/FarmGrid";
import AlertBanner from "@/components/AlertBanner";
import { QuickActionsBar } from "@/components/ui/QuickActionsBar";
import { TutorialOverlay, TutorialButton } from "@/components/ui/TutorialOverlay";
import { MobileSidebar } from "@/components/ui/MobileSidebar";
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
  const [lastPatterns, setLastPatterns] = useState<Array<{name: string, bonus: number}>>([]);

  // Resources
  const [wood, setWood] = useState<number>(0);
  const [stone, setStone] = useState<number>(0);
  const [fiber, setFiber] = useState<number>(0);
  const [seeds, setSeeds] = useState<number>(0);

  // Tools & Items
  const [wateringCanUses, setWateringCanUses] = useState<number>(0);
  const [fertilizerCount, setFertilizerCount] = useState<number>(0);
  const [compostBinCount, setCompostBinCount] = useState<number>(0);

  // Tools: "cursor" (interact/harvest), "wheat", "tomato", "corn", "carrot", "lettuce"
  const [selectedTool, setSelectedTool] = useState<"cursor" | "wheat" | "tomato" | "corn" | "carrot" | "lettuce" | "water" | "fertilize">("cursor");
  const [mounted, setMounted] = useState(false);
  const [accountDeserializationError, setAccountDeserializationError] = useState(false);
  const [selectedPlotForTool, setSelectedPlotForTool] = useState<number | null>(null);

  // Season & Time tracking
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [currentSeason, setCurrentSeason] = useState<number>(0); // 0=Spring, 1=Summer, 2=Fall, 3=Winter

  // Modal states
  const [showCraftingModal, setShowCraftingModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPlantAllModal, setShowPlantAllModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has completed tutorial
    const hasCompletedTutorial = localStorage.getItem('farmGameTutorialCompleted');
    if (!hasCompletedTutorial) {
      // Show tutorial after a brief delay
      setTimeout(() => setShowTutorial(true), 1000);
    }
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
      
      // Financial data
      setCoins(account.coins.toNumber());
      
      // Grid data
      setGrid(createFarmGrid(account.farmTiles as any));

      // Resources
      setWood(account.wood);
      setStone(account.stone);
      setFiber(account.fiber);
      setSeeds(account.seeds);

      // Tools & Items
      setWateringCanUses(account.wateringCanUses);
      setFertilizerCount(account.fertilizerCount);
      setCompostBinCount(account.compostBinCount);

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

    // Handle tool usage (water/fertilize)
    if (selectedTool === "water") {
      waterPlot(index);
      return;
    } else if (selectedTool === "fertilize") {
      fertilizePlot(index);
      return;
    }

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
          authority: wallet.publicKey,
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
    setLastPatterns([]); // Clear previous patterns
    try {
      const program = getProgram(connection, wallet);
      
      // Listen for pattern events
      const listener = program.addEventListener('PatternDetected', (event: any) => {
        const patternNames = ['Row', 'Block', 'Companion', 'Diversity', 'Cross', 'Checkerboard', 'Perimeter', 'Rotation'];
        const name = patternNames[event.patternType] || 'Unknown';
        const bonus = ((event.yieldMultiplier - 1) * 100).toFixed(0);
        setLastPatterns(prev => [...prev, { name, bonus: parseFloat(bonus) }]);
        console.log(`✨ Pattern Detected: ${name} (+${bonus}% yield)`);
      });

      const tx = await program.methods.harvestCrop(index)
        .accounts({
          playerAccount: playerPDA,
          authority: wallet.publicKey,
        } as any)
        .rpc({ skipPreflight: false });
      
      console.log("Harvest TX:", tx);
      program.removeEventListener(listener);
      
      setTxStatus("Harvested! 💰");
      
      // Wait a bit for state update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshState();
      setTimeout(() => setTxStatus(null), 3000);
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
          authority: wallet.publicKey,
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

  // Water a plot
  const waterPlot = async (index: number) => {
    if (!wallet || !playerPDA) return;
    if (wateringCanUses <= 0) {
      alert("⚠️ No watering can uses left! Refill with resources or coins.");
      return;
    }

    setLoading(true);
    setTxStatus("Watering plot... 💧");
    try {
      const program = getProgram(connection, wallet);
      await program.methods
        .waterTile(index)
        .accounts({
          playerAccount: playerPDA,
          authority: wallet.publicKey,
        } as any)
        .rpc({ skipPreflight: false });

      setTxStatus("Plot watered! 💧");
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshState();
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e: any) {
      handleError(e, "Water Plot");
    } finally {
      setLoading(false);
      setSelectedPlotForTool(null);
    }
  };

  // Use fertilizer on a plot
  const fertilizePlot = async (index: number) => {
    if (!wallet || !playerPDA) return;
    if (fertilizerCount <= 0) {
      alert("⚠️ No fertilizer! Craft more with 5 fiber + 3 seeds.");
      return;
    }

    setLoading(true);
    setTxStatus("Applying fertilizer... 🌱");
    try {
      const program = getProgram(connection, wallet);
      await program.methods
        .useFertilizer(index)
        .accounts({
          playerAccount: playerPDA,
          authority: wallet.publicKey,
        } as any)
        .rpc({ skipPreflight: false });

      setTxStatus("Fertilizer applied! 🌱");
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshState();
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e: any) {
      handleError(e, "Fertilize Plot");
    } finally {
      setLoading(false);
      setSelectedPlotForTool(null);
    }
  };

  // Initialize Game (Global - one time only)
  const initializeGame = async () => {
    if (!wallet) return;

    setLoading(true);
    setTxStatus("Initializing Game State... 🔧");
    try {
      const program = getProgram(connection, wallet);
      const [gameConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("game_config")],
        program.programId
      );

      await program.methods
        .initializeGame()
        .accounts({
          gameConfig: gameConfigPDA,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
      
      setTxStatus("Game State Ready! ✅");
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e: any) {
      // If already initialized, that's fine
      if (e.message.includes("already in use")) {
        console.log("Game already initialized");
        setTxStatus(null);
      } else {
        handleError(e, "Initialize Game");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize Season
  const initializeSeason = async () => {
    if (!wallet) return;

    setLoading(true);
    setTxStatus("Initializing Season... 🌾");
    try {
      const program = getProgram(connection, wallet);
      const [seasonStatePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("season_state")],
        program.programId
      );

      await program.methods
        .initializeSeason()
        .accounts({
          seasonState: seasonStatePDA,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
      
      setTxStatus("Season Ready! ✅");
      setTimeout(() => setTxStatus(null), 2000);
    } catch (e: any) {
      // If already initialized, that's fine
      if (e.message.includes("already in use")) {
        console.log("Season already initialized");
        setTxStatus(null);
      } else {
        handleError(e, "Initialize Season");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize Player Farm
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
          authority: wallet.publicKey,
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

  // Season helper functions
  const getSeasonInfo = (season: number) => {
    const seasons = [
      { emoji: '🌸', name: 'Spring', color: 'from-pink-500 to-pink-600', textColor: 'text-pink-600 dark:text-pink-400' },
      { emoji: '☀️', name: 'Summer', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-600 dark:text-yellow-400' },
      { emoji: '🍂', name: 'Fall', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-600 dark:text-orange-400' },
      { emoji: '❄️', name: 'Winter', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600 dark:text-blue-400' }
    ];
    return seasons[season] || seasons[0];
  };

  const getDaysUntilNextSeason = () => {
    const daysPerSeason = 30;
    const daysInSeason = currentDay % daysPerSeason || daysPerSeason;
    return daysPerSeason - daysInSeason;
  };

  // Batch Operations
  const handlePlantAll = () => {
    if (!grid) return;
    setShowPlantAllModal(true);
    // For now, just show an alert - full modal implementation will come in Task D
    alert('🌱 Plant All: This will open a crop selection modal to plant all empty plots. (Full modal coming in Task D)');
  };

  const handleWaterAll = async () => {
    if (!wallet || !grid || loading) return;
    
    // Find all plots that need water (below 60%)
    const plotsToWater: number[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        const index = rowIndex * 5 + colIndex;
        // Check if plot has crop (cropType !== 0 means planted)
        // Note: Currently waterLevel doesn't exist on TileState, so we'll water all planted plots
        if (tile && tile.cropType !== 0) {
          plotsToWater.push(index);
        }
      });
    });

    if (plotsToWater.length === 0) {
      setTxStatus('All plots are well watered! 💧');
      setTimeout(() => setTxStatus(null), 2000);
      return;
    }

    if (wateringCanUses < plotsToWater.length) {
      alert(`⚠️ Need ${plotsToWater.length} watering can uses, but only have ${wateringCanUses}. Craft more watering cans!`);
      return;
    }

    setLoading(true);
    setTxStatus(`Watering ${plotsToWater.length} plots... 💧`);
    
    let successCount = 0;
    for (const index of plotsToWater) {
      try {
        await waterPlot(index);
        successCount++;
      } catch (e) {
        console.error(`Failed to water plot ${index}:`, e);
      }
    }
    
    setLoading(false);
    setTxStatus(`Watered ${successCount}/${plotsToWater.length} plots! 💧✅`);
    setTimeout(() => setTxStatus(null), 3000);
  };

  const handleOpenCrafting = () => {
    setShowCraftingModal(true);
    // For now, just show an alert - full modal implementation will come in Task D
    alert('🔨 Crafting: Full crafting modal coming in Task D! You\'ll be able to craft tools and items here.');
  };

  const handleOpenStats = () => {
    setShowStatsModal(true);
    // For now, show basic stats
    const totalCrops = grid ? grid.flat().filter(t => t && t.cropType !== 0).length : 0;
    const readyCrops = grid ? grid.flat().filter(t => t && t.cropType !== 0 && t.isReady).length : 0;
    alert(
      `📊 Farm Statistics\n\n` +
      `Total Plots: 25\n` +
      `Planted: ${totalCrops}\n` +
      `Ready to Harvest: ${readyCrops}\n` +
      `Points: ${coins}\n\n` +
      `Resources:\n` +
      `🪵 Wood: ${wood}\n` +
      `🪨 Stone: ${stone}\n` +
      `🌿 Fiber: ${fiber}\n` +
      `🌾 Seeds: ${seeds}\n\n` +
      `(Full analytics dashboard coming in Task D)`
    );
  };

  const handleOpenHelp = () => {
    setShowHelpModal(true);
    // For now, show basic help - full tutorial system will come in Task F
    alert(
      `❓ Quick Help\n\n` +
      `🌱 Plant: Click empty plot, select crop\n` +
      `💧 Water: Water plots to maintain growth\n` +
      `🌾 Harvest: Click ready crops (glowing green)\n` +
      `🔨 Craft: Create tools from resources\n` +
      `📊 Patterns: Plant in formations for bonuses\n\n` +
      `(Full tutorial system coming in Task F)`
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 transition-colors relative font-sans">
      {/* TOP BAR - Season, Alerts, Profile */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Season & Time */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${getSeasonInfo(currentSeason).color} text-white shadow-lg cursor-pointer hover:scale-105 transition-transform animate-gradient-shift`}
                   title={`${getDaysUntilNextSeason()} days until next season`}>
                <span className="text-2xl">{getSeasonInfo(currentSeason).emoji}</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{getSeasonInfo(currentSeason).name}</span>
                  <span className="text-xs opacity-90">Day {currentDay}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                ⏰ {getDaysUntilNextSeason()}d until {getSeasonInfo((currentSeason + 1) % 4).name}
              </div>
            </div>

            {/* Center: Title */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-green-800 dark:text-green-400">🌾 Solana Farm</h1>
            </div>

            {/* Right: Profile & Wallet */}
            <div className="flex items-center gap-3">
              {accountExists && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{coins.toLocaleString()} pts</span>
                </div>
              )}
              {mounted && (
                <WalletMultiButton className="!bg-green-700 hover:!bg-green-600 !transition-colors !rounded-lg !font-bold !text-sm" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 pb-24">
        {wallet ? (
          <>
            {/* Alert Banner */}
            {accountExists && grid && (
              <div className="mb-4">
                <AlertBanner tiles={grid.flat()} />
              </div>
            )}

            {accountExists ? (
              <>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* LEFT/CENTER: Farm Grid & Actions */}
                <div className="flex flex-col gap-4">
                  {/* Status Bar showing coins for mobile */}
                  <div className="lg:hidden flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Balance</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">{coins.toLocaleString()} Coins</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Sidebar - Tabbed */}
                  <div className="lg:hidden">
                    <MobileSidebar
                      wood={wood}
                      stone={stone}
                      fiber={fiber}
                      seeds={seeds}
                      wateringCanUses={wateringCanUses}
                      fertilizerCount={fertilizerCount}
                      compostBinCount={compostBinCount}
                      selectedTool={selectedTool}
                      onToolSelect={setSelectedTool}
                    />
                  </div>

                  {/* Transaction Status Overlay */}
                  {txStatus && (
                    <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium text-center animate-fade-in">
                      {txStatus}
                    </div>
                  )}

                  {/* Crop Selection Toolbar */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedTool("cursor")}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${selectedTool === "cursor"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                      >
                        <span>👆</span> <span className="hidden sm:inline">Interact</span>
                      </button>
                      <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                  
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
                  <FarmGrid grid={grid} onTileClick={handleTileClick} selectedTool={selectedTool} />
                </div>

                  {/* Pattern Bonus Display */}
                  {lastPatterns.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-3 rounded-xl border-2 border-amber-300 dark:border-amber-600 animate-pulse">
                      <div className="text-sm space-y-1">
                        <div className="font-bold text-amber-900 dark:text-amber-300 text-xs">✨ Pattern Bonuses!</div>
                        <div className="space-y-1">
                          {lastPatterns.map((pattern, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-1.5 rounded-lg text-xs">
                              <span className="text-amber-700 dark:text-amber-200 font-semibold">{pattern.name}</span>
                              <span className="font-bold text-orange-600 dark:text-orange-400">+{pattern.bonus}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDEBAR: Resources & Tools - Desktop Only */}
                <div className="hidden lg:flex flex-col gap-4">
                  {/* Resources Panel */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>📦</span> Resources
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🪵</span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Wood</span>
                        </div>
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">{wood}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🪨</span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Stone</span>
                        </div>
                        <span className="text-sm font-bold text-stone-700 dark:text-stone-400">{stone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌾</span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Fiber</span>
                        </div>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{fiber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌱</span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Seeds</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{seeds}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tools Panel */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>🛠️</span> Tools & Items
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💧</span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Watering Can</span>
                          </div>
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{wateringCanUses} uses</span>
                        </div>
                        {wateringCanUses > 0 && (
                          <button
                            onClick={() => setSelectedTool("water")}
                            className={`w-full px-3 py-2 rounded-lg font-medium transition-all text-xs ${selectedTool === "water"
                              ? "bg-blue-600 text-white shadow-lg scale-105"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                              }`}
                          >
                            💧 {selectedTool === "water" ? "Selected - Click Plot" : "Water Plot"}
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌱</span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Fertilizer</span>
                          </div>
                          <span className="text-sm font-bold text-purple-700 dark:text-purple-400">{fertilizerCount}</span>
                        </div>
                        {fertilizerCount > 0 && (
                          <button
                            onClick={() => setSelectedTool("fertilize")}
                            className={`w-full px-3 py-2 rounded-lg font-medium transition-all text-xs ${selectedTool === "fertilize"
                              ? "bg-purple-600 text-white shadow-lg scale-105"
                              : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200"
                              }`}
                          >
                            🌱 {selectedTool === "fertilize" ? "Selected - Click Plot" : "Fertilize"}
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">♻️</span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Compost Bins</span>
                          </div>
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">{compostBinCount}</span>
                        </div>
                        {compostBinCount > 0 && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-center">
                            Ready to collect
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                    <div className="text-xs space-y-2">
                      <div className="font-bold text-blue-900 dark:text-blue-300">💡 Quick Tips</div>
                      <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-[10px]">
                        <li>• Plant 3+ same crops for +15% Row bonus</li>
                        <li>• 2×2 blocks get +20% yield</li>
                        <li>• Rotate crops for +10% bonus</li>
                        <li>• Carrots restore fertility!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips & Help Section - Below Grid */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-sm space-y-2">
                <div className="font-bold text-blue-900 dark:text-blue-300 mb-2">🎯 Pattern Synergies System:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex gap-2">
                      <span>📏</span>
                      <span><strong>Monoculture Row:</strong> 3+ same crops in a line (+15%)</span>
                    </div>
                    <div className="flex gap-2">
                      <span>🟩</span>
                      <span><strong>Monoculture Block:</strong> 2×2 square of same crop (+20%)</span>
                    </div>
                    <div className="flex gap-2">
                      <span>🤝</span>
                      <span><strong>Companion Planting:</strong> Wheat+Carrot or Corn+Lettuce (+5-10%)</span>
                    </div>
                    <div className="flex gap-2">
                      <span>🌈</span>
                      <span><strong>Crop Diversity:</strong> 4 different neighbors (+25% + fertility)</span>
                    </div>
                    <div className="flex gap-2">
                      <span>✚</span>
                      <span><strong>Cross Pattern:</strong> + shape of same crop (+30% + seeds)</span>
                    </div>
                    <div className="flex gap-2">
                      <span>🏰</span>
                      <span><strong>Perimeter Defense:</strong> Different crops around center (+40%)</span>
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
                <div className="flex flex-col gap-3 mx-auto w-full max-w-sm">
                  <button
                    onClick={initializeGame}
                    disabled={loading}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all font-bold shadow-lg transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? "Initializing..." : "🔧 Initialize Game State (Required Once)"}
                  </button>
                  <button
                    onClick={initializeSeason}
                    disabled={loading}
                    className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition-all font-bold shadow-lg transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? "Initializing..." : "🌾 Initialize Season (Required Once)"}
                  </button>
                  <button
                    onClick={initializePlayer}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all font-bold shadow-lg transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {loading ? "Constructing..." : "Initialize Farm ✨"}
                  </button>
                </div>
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

      {/* Quick Actions Bar - Fixed Bottom */}
      {accountExists && grid && (
        <QuickActionsBar
          onPlantAll={handlePlantAll}
          onWaterAll={handleWaterAll}
          onOpenCrafting={handleOpenCrafting}
          onOpenStats={handleOpenStats}
          onOpenHelp={handleOpenHelp}
          disabled={loading}
        />
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} />
      )}

      {/* Tutorial Restart Button */}
      {!showTutorial && mounted && (
        <TutorialButton onClick={() => setShowTutorial(true)} />
      )}
    </main>
  );
}
