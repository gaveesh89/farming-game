# Farming Game (Solana)

An on-chain farming game built with Anchor (Solana) and Next.js.

## Project Structure
- `farming-game/`: Solana Anchor programs and tests.
- `farming-ui/`: Next.js frontend with Solana Wallet Adapter.

## Quick Start

### Backend (Anchor)
```bash
cd farming-game
anchor build
```

### Frontend (Next.js)
```bash
cd farming-ui
npm install
npm run dev
```

## Features
- Initialize Player PDA
- Plant Crops (Wheat/Corn)
- Harvest Crops for rewards
- On-chain game state
