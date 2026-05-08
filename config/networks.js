/**
 * config/networks.js
 * ──────────────────────────────────────────────────────────
 * Semua chain yang didukung bot ini.
 *
 * Cara tambah network baru:
 *   Cukup tambah entry baru di object NETWORKS di bawah.
 *   Tidak perlu ubah file lain.
 *
 * Cara pakai:
 *   Set NETWORK=base (atau chain lain) di file .env
 */

export const NETWORKS = {

    // ── Layer 1 ────────────────────────────────────────────
    ethereum: {
        name: "Ethereum Mainnet",
        chainId: 1,
        rpc: "https://eth.llamarpc.com",
        explorer: "https://etherscan.io",
        symbol: "ETH",
    },

    // ── Layer 2 ────────────────────────────────────────────
    base: {
        name: "Base Mainnet",
        chainId: 8453,
        rpc: "https://mainnet.base.org",
        explorer: "https://basescan.org",
        symbol: "ETH",
    },

    arbitrum: {
        name: "Arbitrum One",
        chainId: 42161,
        rpc: "https://arb1.arbitrum.io/rpc",
        explorer: "https://arbiscan.io",
        symbol: "ETH",
    },

    optimism: {
        name: "Optimism Mainnet",
        chainId: 10,
        rpc: "https://mainnet.optimism.io",
        explorer: "https://optimistic.etherscan.io",
        symbol: "ETH",
    },

    polygon: {
        name: "Polygon Mainnet",
        chainId: 137,
        rpc: "https://polygon-rpc.com",
        explorer: "https://polygonscan.com",
        symbol: "POL",
    },

    zora: {
        name: "Zora Mainnet",
        chainId: 7777777,
        rpc: "https://rpc.zora.energy",
        explorer: "https://explorer.zora.energy",
        symbol: "ETH",
    },

    blast: {
        name: "Blast Mainnet",
        chainId: 81457,
        rpc: "https://rpc.blast.io",
        explorer: "https://blastscan.io",
        symbol: "ETH",
    },

    // ── Testnets (development only) ────────────────────────
    baseSepolia: {
        name: "Base Sepolia Testnet",
        chainId: 84532,
        rpc: "https://sepolia.base.org",
        explorer: "https://sepolia.basescan.org",
        symbol: "ETH",
    },

    sepolia: {
        name: "Ethereum Sepolia Testnet",
        chainId: 11155111,
        rpc: "https://rpc.sepolia.org",
        explorer: "https://sepolia.etherscan.io",
        symbol: "ETH",
    },

};