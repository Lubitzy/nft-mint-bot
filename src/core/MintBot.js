/**
 * src/core/MintBot.js
 * ──────────────────────────────────────────────────────────
 * Orchestrator utama — menghubungkan semua service.
 *
 * Pola desain: FACADE PATTERN
 *   MintBot tidak punya logika detail sendiri.
 *   Dia hanya memanggil service dengan urutan yang benar
 *   dan menangani error di level atas.
 *
 *   Alur:
 *     1. initialize()  → WalletService + ContractService
 *     2. waitForMint() → PhaseService (schedule + countdown)
 *     3. executeMint() → ContractService (transaksi)
 *
 *   ┌─────────────┐
 *   │   MintBot   │  ← kamu ada di sini (index.js memanggil ini)
 *   └──────┬──────┘
 *          │ memanggil
 *    ┌─────┴──────────────────┐
 *    │                        │
 *    ▼                        ▼
 * WalletService          PhaseService
 *    │                        │
 *    ▼                        ▼
 * ContractService        (countdown)
 *    │
 *    ▼
 * Blockchain ✅
 */

import { ethers } from "ethers";
import { BOT_CONFIG } from "../../config/bot.config.js";
import { WalletService } from "../services/WalletService.js";
import { ContractService } from "../services/ContractService.js";
import { PhaseService } from "../services/PhaseService.js";
import { logger } from "../utils/logger.js";
import { sleep } from "../utils/time.js";

export class MintBot {

    constructor() {
        this.config = BOT_CONFIG;
        this.wallet = new WalletService(this.config);
        this.contract = null;  // dibuat setelah wallet connect
        this.phase = new PhaseService(
            this.config.PHASES,
            this.config.RETRY?.DELAY_MS || 500
        );
    }

    // ─────────────────────────────────────────────────────
    // Step 1: Inisialisasi
    // ─────────────────────────────────────────────────────
    async initialize() {
        logger.title("NFT AUTO MINT BOT  v1.0.0");

        // Guard: cek private key
        if (!this.config.PRIVATE_KEY) {
            throw new Error(
                "PRIVATE_KEY tidak ditemukan!\n" +
                "Buat file .env dari .env.example dan isi private key."
            );
        }

        // Connect wallet ke blockchain
        logger.info("Connecting to blockchain...");
        await this.wallet.connect();
        await this.wallet.printInfo();
        logger.divider();

        // Load contract & ABI
        logger.info("Loading contract...");
        this.contract = new ContractService(this.config, this.wallet);
        await this.contract.load();

        // Print mint stats (supply info)
        const stats = await this.contract.getMintStats();
        if (stats.total !== null) {
            logger.detail(`Supply   : ${stats.total} / ${stats.max ?? "?"} minted`);
        }
        if (stats.minterMinted !== null) {
            logger.detail(`Kamu     : sudah mint ${stats.minterMinted} NFT`);
        }

        // Kalau SeaDrop, ambil info harga on-chain sebagai verifikasi
        if (this.config.MINT_TYPE === "seadrop") {
            const drop = await this.contract.getPublicDrop();
            if (drop) {
                logger.detail(`Price    : ${drop.mintPrice} ETH (on-chain)`);
                logger.detail(`Max/wallet: ${drop.maxPerWallet}`);
            }
        }

        logger.divider();
    }

    // ─────────────────────────────────────────────────────
    // Step 2: Pilih phase & tunggu window terbuka
    // ─────────────────────────────────────────────────────
    async waitForMint() {
        this.phase.printSchedule();
        const targetPhase = this.phase.selectTargetPhase();
        const isOpen = await this.phase.waitForWindow(targetPhase);

        if (!isOpen) {
            throw new Error("Mint window tidak tersedia.");
        }

        return targetPhase;
    }

    // ─────────────────────────────────────────────────────
    // Step 3: Eksekusi mint dengan retry
    // ─────────────────────────────────────────────────────
    async executeMint(targetPhase) {
        logger.title("EKSEKUSI MINT");

        const quantity = this.config.MINT_QUANTITY;
        const priceWei = ethers.parseEther(targetPhase.priceEth || "0");
        const totalWei = priceWei * BigInt(quantity);
        const mintFn = this.config.MINT_FUNCTION;

        logger.info(`Phase    : ${targetPhase.name}`);
        logger.info(`Type     : ${this.config.MINT_TYPE.toUpperCase()}`);
        logger.info(`Quantity : ${quantity} NFT`);
        logger.info(`Total    : ${ethers.formatEther(totalWei)} ${this.wallet.symbol}`);
        logger.divider();

        // Validasi balance cukup
        await this.wallet.validateBalance(totalWei);

        const { MAX_ATTEMPTS, DELAY_MS } = this.config.RETRY;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                logger.info(`Attempt ${attempt}/${MAX_ATTEMPTS}...`);

                const receipt = await this.contract.executeMint(mintFn, quantity, totalWei);

                if (receipt.status === 1) {
                    this._printSuccess(receipt, targetPhase);
                    return receipt;
                }

                logger.error("Transaksi di-revert oleh contract!");

            } catch (err) {
                logger.error(`Attempt ${attempt} gagal:`);
                logger.detail(err.message?.substring(0, 250) || "Unknown error");

                // Error fatal — hentikan retry
                if (this._isFatalError(err)) {
                    logger.error("Error fatal, menghentikan bot.");
                    break;
                }

                if (attempt < MAX_ATTEMPTS) {
                    logger.info(`Retry dalam ${DELAY_MS}ms...`);
                    await sleep(DELAY_MS);
                }
            }
        }

        throw new Error(`Mint gagal setelah ${MAX_ATTEMPTS} attempts.`);
    }

    // ─────────────────────────────────────────────────────
    // Entry point utama
    // ─────────────────────────────────────────────────────
    async run() {
        try {
            await this.initialize();
            const targetPhase = await this.waitForMint();
            await this.executeMint(targetPhase);

        } catch (err) {
            logger.error(`\n  FATAL: ${err.message}`);
            process.exit(1);
        }
    }

    // ─────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────

    _printSuccess(receipt, phase) {
        logger.title("🎉 MINT BERHASIL!");
        logger.detail(`Phase    : ${phase.name}`);
        logger.detail(`Block    : ${receipt.blockNumber}`);
        logger.detail(`Gas used : ${receipt.gasUsed.toLocaleString()}`);
        logger.detail(`TX Hash  : ${receipt.hash}`);
        logger.detail(`Explorer : ${this.wallet.explorer}/tx/${receipt.hash}`);

        const tokenIds = this.contract.parseTokenIds(receipt);
        if (tokenIds.length > 0) {
            logger.success(`${tokenIds.length} NFT berhasil di-mint:`);
            tokenIds.forEach(id => logger.detail(`  🖼  Token #${id}`));
        }

        logger.divider();
        logger.success("Log tersimpan di folder logs/");
    }

    _isFatalError(err) {
        const msg = (err.message || "").toLowerCase();
        return [
            "insufficient funds",
            "already minted",
            "max per wallet",
            "exceeds max",
            "not eligible",
            "not active",
        ].some(keyword => msg.includes(keyword));
    }
}