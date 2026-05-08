# 🔨 NFT Auto Mint Bot

> **Professional NFT auto-mint automation bot built with Node.js & ethers.js**
>
> Supports SeaDrop (OpenSea) protocol & standard ERC721A contracts.
> Multi-chain ready. Plug & Play for any NFT project.

<br>

## ✨ Features

| Feature                   | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| ⛓️ **Multi-chain**        | Base, Ethereum, Arbitrum, Optimism, Polygon, Zora, Blast |
| 🔌 **SeaDrop Support**    | Native OpenSea SeaDrop protocol mint                     |
| 🧩 **Plug & Play ABI**    | Drop any ABI JSON into `contracts/` — zero code changes  |
| ⏰ **Auto Timing**        | Real-time countdown, executes the moment mint opens      |
| 🔄 **Auto Retry**         | Configurable retry with smart fatal error detection      |
| ⛽ **Smart Gas**          | Auto gas estimation + configurable buffer                |
| 📝 **Session Logs**       | Every session saved to `logs/` with timestamps           |
| 🏗️ **Clean Architecture** | Service layer, single responsibility, easily extendable  |

<br>

## 🏗️ Project Structure

```
nft-mint-bot/
│
├── index.js                     ← Entry point (run this)
│
├── config/
│   ├── bot.config.js            ← ⚡ Edit this for every new NFT project
│   └── networks.js              ← All supported chains (add more here)
│
├── contracts/
│   ├── forgeon.abi.json         ← Forgeon NFT ABI (Base chain)
│   └── seadrop.abi.json         ← OpenSea SeaDrop protocol ABI
│
├── src/
│   ├── core/
│   │   └── MintBot.js           ← Orchestrator (Facade Pattern)
│   │
│   ├── services/
│   │   ├── WalletService.js     ← Wallet connection & balance
│   │   ├── ContractService.js   ← ABI loading & all tx logic
│   │   └── PhaseService.js      ← Mint schedule & countdown
│   │
│   └── utils/
│       ├── logger.js            ← Console + file logging (Winston)
│       └── time.js              ← Time helpers & countdown
│
├── logs/                        ← Auto-generated session logs
├── .env.example                 ← Environment variables template
├── .gitignore
└── README.md
```

<br>

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/nft-mint-bot.git
cd nft-mint-bot
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PRIVATE_KEY=your_private_key_here
NETWORK=base
MINT_QUANTITY=1
MAX_FEE=0.1
PRIORITY_FEE=0.05
```

### 3. Configure Your Target NFT

Edit `config/bot.config.js`:

```js
CONTRACT_ADDRESS: "0xYourNFTContractAddress",
ABI_FILE:         "yourproject.abi.json",
MINT_TYPE:        "seadrop",   // or "standard"
SEADROP_ADDRESS:  "0x00005EA00Ac477B1030CE78506496e8C2dE24bf5",
FEE_RECIPIENT:    "0x000...",

PHASES: [
  {
    id:        "PUBLIC",
    name:      "Public Mint",
    startTime: new Date("2026-06-01T17:00:00.000Z"),  // UTC
    endTime:   new Date("2026-06-02T17:00:00.000Z"),
    priceEth:  "0.003",
    eligible:  true,
  }
]
```

### 4. Add ABI Contract

1. Open block explorer (Basescan, Etherscan, etc.)
2. Search contract address → tab **Contract** → **Copy ABI**
3. Save to `contracts/yourproject.abi.json`
4. Set `ABI_FILE: "yourproject.abi.json"` in `bot.config.js`

### 5. Run the Bot

```bash
npm start
```

<br>

## 🌐 Supported Networks

| Key           | Network          | Explorer                |
| ------------- | ---------------- | ----------------------- |
| `base`        | Base Mainnet     | basescan.org            |
| `ethereum`    | Ethereum Mainnet | etherscan.io            |
| `arbitrum`    | Arbitrum One     | arbiscan.io             |
| `optimism`    | Optimism         | optimistic.etherscan.io |
| `polygon`     | Polygon          | polygonscan.com         |
| `zora`        | Zora             | explorer.zora.energy    |
| `blast`       | Blast            | blastscan.io            |
| `baseSepolia` | Base Testnet     | sepolia.basescan.org    |

<br>

## ⛽ Gas Settings Guide

```env
# Normal conditions
MAX_FEE=0.1
PRIORITY_FEE=0.05

# Competitive mint
MAX_FEE=0.5
PRIORITY_FEE=0.2

# High-demand mint
MAX_FEE=2.0
PRIORITY_FEE=1.0
```

<br>

## 🔧 Mint Types

### SeaDrop (OpenSea Protocol)

Used by projects launched via OpenSea's SeaDrop contract.  
Identified by `mintSeaDrop` function in the contract ABI.

```js
MINT_TYPE:       "seadrop",
SEADROP_ADDRESS: "0x00005EA00Ac477B1030CE78506496e8C2dE24bf5",
FEE_RECIPIENT:   "0x0000a26b00c1F0DF003000390027140000fAa719",
```

### Standard ERC721A

Used by projects with a custom mint function.

```js
MINT_TYPE:     "standard",
MINT_FUNCTION: "mint",   // or "publicMint", "mintPublic", etc.
```

<br>

## 🔒 Security

- ✅ Private key stored only in `.env` — never hardcoded
- ✅ `.env` is in `.gitignore` — will never be committed
- ✅ Use a **dedicated wallet** just for the bot
- ✅ Only fund the wallet with what you need: `(price × qty) + gas`

<br>

## 📐 Architecture & Design Patterns

```
index.js
    └── MintBot (Facade Pattern)
            ├── WalletService    → Single Responsibility: network & wallet
            ├── ContractService  → Single Responsibility: ABI & transactions
            └── PhaseService     → Single Responsibility: schedule & timing
```

- **Facade Pattern** — `MintBot.js` exposes a simple `run()` interface
- **Service Layer** — each service owns exactly one concern (SRP)
- **Dependency Injection** — services are injected into the orchestrator
- **Separation of Concerns** — config, ABI, logic, and utils are fully decoupled

<br>

## 🛠️ Tech Stack

|                | Library                                         | Version |
| -------------- | ----------------------------------------------- | ------- |
| Blockchain     | [ethers.js](https://docs.ethers.org/v6/)        | v6      |
| Logging        | [Winston](https://github.com/winstonjs/winston) | v3      |
| Console colors | [Chalk](https://github.com/chalk/chalk)         | v5      |
| Environment    | [dotenv](https://github.com/motdotla/dotenv)    | v17     |

<br>

## 📝 License

MIT © Lubi
