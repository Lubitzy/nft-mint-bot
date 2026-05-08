/**
 * config/bot.config.js
 * ──────────────────────────────────────────────────────────
 * ⚡ FILE INI YANG KAMU EDIT setiap ganti project NFT baru.
 *
 * Checklist tiap mint project baru:
 *   [ ] Ganti CONTRACT_ADDRESS
 *   [ ] Ganti ABI_FILE  (taruh file ABI di folder contracts/)
 *   [ ] Ganti SEADROP_ADDRESS  (kalau bukan SeaDrop, set null)
 *   [ ] Set MINT_TYPE: "seadrop" atau "standard"
 *   [ ] Update PHASES sesuai jadwal project
 *   [ ] Set eligible: true di phase yang kamu ikut
 *   [ ] Sesuaikan GAS sesuai kondisi network
 */

import dotenv from "dotenv";
dotenv.config();

export const BOT_CONFIG = {

    // ─────────────────────────────────────────────────────
    // 🌐 NETWORK
    // Pilihan: ethereum | base | arbitrum | optimism |
    //          polygon  | zora | blast    | baseSepolia
    // ─────────────────────────────────────────────────────
    NETWORK: process.env.NETWORK || "base",
    CUSTOM_RPC: process.env.RPC_URL || "",   // kosongkan = pakai default RPC

    // ─────────────────────────────────────────────────────
    // 🔑 WALLET  (selalu dari .env, jangan hardcode!)
    // ─────────────────────────────────────────────────────
    PRIVATE_KEY: process.env.PRIVATE_KEY,

    // ─────────────────────────────────────────────────────
    // 📜 CONTRACT
    // ─────────────────────────────────────────────────────
    CONTRACT_ADDRESS: "0x9fE22A3B846F7c6345Bfdf4B5c6c5F3fc930f191",

    // Nama file ABI di folder contracts/
    ABI_FILE: "staco.json",

    // ─────────────────────────────────────────────────────
    // 🔧 MINT TYPE
    //
    //  "seadrop"  → Kontrak pakai OpenSea SeaDrop protocol
    //               (mint lewat SeaDrop contract, bukan langsung)
    //               Butuh: SEADROP_ADDRESS + FEE_RECIPIENT
    //
    //  "standard" → Kontrak punya fungsi mint sendiri
    //               (ERC721A, custom mint, dll)
    //               Butuh: MINT_FUNCTION
    // ─────────────────────────────────────────────────────
    MINT_TYPE: "seadrop",

    // ── SeaDrop settings (hanya untuk MINT_TYPE = "seadrop") ──
    // SeaDrop contract address di Base mainnet
    SEADROP_ADDRESS: "0x00005EA00Ac477B1030CE78506496e8C2dE24bf5",

    // Fee recipient — ambil dari OpenSea / project docs
    // Ini biasanya address treasury project atau OpenSea
    FEE_RECIPIENT: "0x0000a26b00c1F0DF003000390027140000fAa719",

    // ── Standard settings (hanya untuk MINT_TYPE = "standard") ──
    // Nama fungsi mint — cek di block explorer → Write Contract
    MINT_FUNCTION: "mint",

    // ─────────────────────────────────────────────────────
    // 🎯 MINT QUANTITY
    // ─────────────────────────────────────────────────────
    MINT_QUANTITY: parseInt(process.env.MINT_QUANTITY) || 1,

    // ─────────────────────────────────────────────────────
    // ⛽ GAS  (satuan: Gwei)
    //
    //  Situasi       MAX_FEE   PRIORITY
    //  ─────────────────────────────────
    //  Normal        0.1       0.05
    //  Rebutan       0.5       0.2
    //  Super panas   2.0       1.0
    // ─────────────────────────────────────────────────────
    GAS: {
        MAX_FEE_GWEI: process.env.MAX_FEE || "0.1",
        PRIORITY_FEE_GWEI: process.env.PRIORITY_FEE || "0.05",
        LIMIT_BUFFER: 1.2,    // estimasi gas × 1.2 (buffer 20%)
        FALLBACK_LIMIT: 300000, // dipakai kalau estimasi gagal
    },

    // ─────────────────────────────────────────────────────
    // 🔄 RETRY
    // ─────────────────────────────────────────────────────
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY_MS: 500,
    },

    // ─────────────────────────────────────────────────────
    // ⏰ MINT PHASES
    //
    // Cara konversi waktu WIB → UTC:
    //   WIB (GMT+7) dikurangi 7 jam = UTC
    //   Contoh: 00:00 WIB 8 Mei = 17:00 UTC 7 Mei
    //           23:30 WIB 7 Mei = 16:30 UTC 7 Mei
    //
    // eligible: true  → bot AKAN mint di phase ini
    // eligible: false → bot SKIP phase ini
    // ─────────────────────────────────────────────────────
    PHASES: [
        {
            id: "GUARANTED_STACO",
            name: "Guaranted Staco",
            startTime: new Date("2026-05-12T16:00:00.000Z"), // 23:00 WIB
            endTime: new Date("2026-05-12T16:30:00.000Z"), // 23:30 WIB
            priceEth: "0.00",
            maxPerWallet: 2,
            eligible: false,
        },
        {
            id: "FIRST_COME_FIRST_STACO",
            name: "First Come First Staco",
            startTime: new Date("2026-05-12T17:00:00.000Z"), // 00:00 WIB (May 13)
            endTime: new Date("2026-05-12T17:30:00.000Z"), // 00:30 WIB (May 13)
            priceEth: "0.00",
            maxPerWallet: 1,
            eligible: false,
        },
        {
            id: "SUPPORT_STACO",
            name: "Support Staco",
            startTime: new Date("2026-05-12T18:00:00.000Z"), // 01:00 WIB (May 13)
            endTime: new Date("2026-05-12T18:30:00.000Z"), // 01:30 WIB (May 13)
            priceEth: "0.00",
            maxPerWallet: 1,
            eligible: false,   // whitelist only
        },
        {
            id: "PUBLIC_STAGE",
            name: "Public Stage",
            startTime: new Date("2026-05-12T19:00:00.000Z"), // 02:00 WIB (May 13)
            endTime: new Date("2026-05-12T20:00:00.000Z"), // 03:00 WIB (May 13)
            priceEth: "0.00",
            maxPerWallet: 1,
            eligible: true,   // ✅ AKTIF — kamu eligible di phase ini
        },
    ],

};