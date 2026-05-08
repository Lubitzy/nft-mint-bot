/**
 * src/services/WalletService.js
 * ──────────────────────────────────────────────────────────
 * Tanggung jawab SATU:
 *   Semua hal yang berkaitan dengan wallet & koneksi jaringan.
 *
 *   ✅ Connect ke RPC
 *   ✅ Inisialisasi wallet dari private key
 *   ✅ Validasi chain ID
 *   ✅ Cek & validasi balance
 *   ✅ Print info wallet
 *
 *   ❌ Tidak tahu soal contract
 *   ❌ Tidak tahu soal mint logic
 */

import { ethers } from "ethers";
import { logger } from "../utils/logger.js";
import { NETWORKS } from "../../config/networks.js";

export class WalletService {

    constructor(config) {
        this.config = config;
        this.provider = null;
        this.wallet = null;
        this.network = null;
    }

    /**
     * Connect ke blockchain dan inisialisasi wallet
     */
    async connect() {
        const key = this.config.NETWORK;
        this.network = NETWORKS[key];

        if (!this.network) {
            throw new Error(
                `Network "${key}" tidak ditemukan.\n` +
                `Pilihan valid: ${Object.keys(NETWORKS).join(", ")}`
            );
        }

        const rpcUrl = this.config.CUSTOM_RPC || this.network.rpc;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(this.config.PRIVATE_KEY, this.provider);

        // Verifikasi chain ID agar tidak salah network
        const onchain = await this.provider.getNetwork();
        if (Number(onchain.chainId) !== this.network.chainId) {
            throw new Error(
                `Chain ID mismatch!\n` +
                `  Ekspektasi : ${this.network.chainId} (${this.network.name})\n` +
                `  Dapat      : ${onchain.chainId}`
            );
        }

        return this;
    }

    /**
     * Tampilkan info wallet ke console
     */
    async printInfo() {
        const balanceWei = await this.provider.getBalance(this.wallet.address);
        const balanceEth = ethers.formatEther(balanceWei);

        logger.detail(`Wallet   : ${this.wallet.address}`);
        logger.detail(`Balance  : ${parseFloat(balanceEth).toFixed(6)} ${this.network.symbol}`);
        logger.detail(`Network  : ${this.network.name}`);
        logger.detail(`Explorer : ${this.network.explorer}`);
    }

    /**
     * Ambil balance dalam wei
     * @returns {bigint}
     */
    async getBalance() {
        return this.provider.getBalance(this.wallet.address);
    }

    /**
     * Validasi balance cukup untuk transaksi
     * @param {bigint} requiredWei
     * @throws {Error} kalau balance kurang
     */
    async validateBalance(requiredWei) {
        const balance = await this.getBalance();

        if (balance < requiredWei) {
            throw new Error(
                `Balance tidak cukup!\n` +
                `  Punya  : ${ethers.formatEther(balance)} ${this.network.symbol}\n` +
                `  Butuh  : ${ethers.formatEther(requiredWei)} ${this.network.symbol}`
            );
        }

        return balance;
    }

    // ── Getters ───────────────────────────────────────────
    get address() { return this.wallet.address; }
    get signer() { return this.wallet; }
    get explorer() { return this.network.explorer; }
    get symbol() { return this.network.symbol; }
}