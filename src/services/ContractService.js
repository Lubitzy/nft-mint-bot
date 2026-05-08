/**
 * src/services/ContractService.js
 * ──────────────────────────────────────────────────────────
 * Tanggung jawab SATU:
 *   Semua interaksi dengan smart contract.
 *
 *   ✅ Load ABI dari file contracts/
 *   ✅ Inisialisasi contract instance
 *   ✅ Baca data contract (supply, stats)
 *   ✅ Estimasi gas
 *   ✅ Eksekusi mint (SeaDrop & Standard)
 *   ✅ Parse token ID dari receipt
 *
 *   ❌ Tidak tahu soal wallet setup
 *   ❌ Tidak tahu soal jadwal / countdown
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { logger } from "../utils/logger.js";

export class ContractService {

    constructor(config, walletService) {
        this.config = config;
        this.walletService = walletService;
        this.nftContract = null;  // contract NFT (Forgeon, dll)
        this.seaDropContract = null;  // SeaDrop contract (kalau pakai SeaDrop)
    }

    /**
     * Load ABI dan inisialisasi contract instance(s)
     */
    async load() {
        // Load ABI NFT contract
        const nftAbi = this._readABI(this.config.ABI_FILE);
        this.nftContract = new ethers.Contract(
            this.config.CONTRACT_ADDRESS,
            nftAbi,
            this.walletService.signer
        );

        logger.success(`ABI loaded  : contracts/${this.config.ABI_FILE}`);
        logger.detail(`NFT Contract: ${this.config.CONTRACT_ADDRESS}`);

        // Kalau SeaDrop, load juga SeaDrop contract
        if (this.config.MINT_TYPE === "seadrop") {
            const seaDropAbi = this._readABI("seadrop.abi.json");
            this.seaDropContract = new ethers.Contract(
                this.config.SEADROP_ADDRESS,
                seaDropAbi,
                this.walletService.signer
            );
            logger.detail(`SeaDrop     : ${this.config.SEADROP_ADDRESS}`);
        }

        return this;
    }

    /**
     * Ambil statistik mint dari contract
     * @returns {{ minted: number|null, max: number|null }}
     */
    async getMintStats() {
        try {
            // getMintStats adalah fungsi spesifik Forgeon/SeaDrop
            const stats = await this.nftContract.getMintStats(this.walletService.address);
            return {
                minterMinted: Number(stats.minterNumMinted),
                total: Number(stats.currentTotalSupply),
                max: Number(stats.maxSupply),
            };
        } catch {
            // Fallback untuk contract ERC721A standar
            try {
                const [total, max] = await Promise.allSettled([
                    this.nftContract.totalSupply(),
                    this.nftContract.maxSupply(),
                ]);
                return {
                    minterMinted: null,
                    total: total.status === "fulfilled" ? Number(total.value) : null,
                    max: max.status === "fulfilled" ? Number(max.value) : null,
                };
            } catch {
                return { minterMinted: null, total: null, max: null };
            }
        }
    }

    /**
     * Ambil info public drop dari SeaDrop (harga on-chain)
     * @returns {object|null}
     */
    async getPublicDrop() {
        if (this.config.MINT_TYPE !== "seadrop" || !this.seaDropContract) return null;
        try {
            const drop = await this.seaDropContract.getPublicDrop(this.config.CONTRACT_ADDRESS);
            return {
                mintPrice: ethers.formatEther(drop.mintPrice),
                startTime: new Date(Number(drop.startTime) * 1000),
                endTime: new Date(Number(drop.endTime) * 1000),
                maxPerWallet: Number(drop.maxTotalMintableByWallet),
            };
        } catch {
            return null;
        }
    }

    /**
     * Eksekusi mint — otomatis pilih SeaDrop atau Standard
     * @param {string} fnName   - nama fungsi (untuk standard)
     * @param {number} quantity
     * @param {bigint} valueWei - total ETH dalam wei
     * @returns {ethers.TransactionReceipt}
     */
    async executeMint(fnName, quantity, valueWei) {
        if (this.config.MINT_TYPE === "seadrop") {
            return this._mintSeaDrop(quantity, valueWei);
        } else {
            return this._mintStandard(fnName, quantity, valueWei);
        }
    }

    /**
     * Parse token ID yang di-mint dari receipt event Transfer
     * @param   {ethers.TransactionReceipt} receipt
     * @returns {bigint[]}
     */
    parseTokenIds(receipt) {
        const transferTopic = ethers.id("Transfer(address,address,uint256)");
        return receipt.logs
            .filter(l => l.topics[0] === transferTopic)
            .map(l => ethers.toBigInt(l.topics[3]));
    }

    // ── Private: SeaDrop Mint ──────────────────────────────

    async _mintSeaDrop(quantity, valueWei) {
        const gasLimit = await this._estimateGas(
            this.seaDropContract,
            "mintPublic",
            [
                this.config.CONTRACT_ADDRESS,
                this.config.FEE_RECIPIENT,
                ethers.ZeroAddress,   // minterIfNotPayer = address(0) artinya payer = minter
                quantity,
            ],
            valueWei
        );

        const tx = await this.seaDropContract.mintPublic(
            this.config.CONTRACT_ADDRESS,
            this.config.FEE_RECIPIENT,
            ethers.ZeroAddress,
            quantity,
            {
                value: valueWei,
                gasLimit,
                maxFeePerGas: ethers.parseUnits(this.config.GAS.MAX_FEE_GWEI, "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits(this.config.GAS.PRIORITY_FEE_GWEI, "gwei"),
            }
        );

        return this._waitForReceipt(tx);
    }

    // ── Private: Standard Mint ────────────────────────────

    async _mintStandard(fnName, quantity, valueWei) {
        // Validasi fungsi ada di ABI
        try {
            this.nftContract.interface.getFunction(fnName);
        } catch {
            throw new Error(
                `Fungsi "${fnName}" tidak ada di ABI!\n` +
                `Cek config/bot.config.js → MINT_FUNCTION\n` +
                `Referensi: ${this.walletService.explorer}/address/${this.config.CONTRACT_ADDRESS}#writeContract`
            );
        }

        const gasLimit = await this._estimateGas(
            this.nftContract, fnName, [quantity], valueWei
        );

        const tx = await this.nftContract[fnName](quantity, {
            value: valueWei,
            gasLimit,
            maxFeePerGas: ethers.parseUnits(this.config.GAS.MAX_FEE_GWEI, "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits(this.config.GAS.PRIORITY_FEE_GWEI, "gwei"),
        });

        return this._waitForReceipt(tx);
    }

    // ── Private: Helpers ──────────────────────────────────

    async _estimateGas(contract, fnName, args, value) {
        try {
            const estimated = await contract[fnName].estimateGas(...args, { value });
            const buffer = BigInt(Math.round(this.config.GAS.LIMIT_BUFFER * 100));
            const withBuf = (estimated * buffer) / 100n;
            logger.detail(`Gas estimate: ${estimated} → with buffer: ${withBuf}`);
            return withBuf;
        } catch {
            const fallback = BigInt(this.config.GAS.FALLBACK_LIMIT);
            logger.warn(`Gas estimation gagal, pakai fallback: ${fallback}`);
            return fallback;
        }
    }

    async _waitForReceipt(tx) {
        logger.success(`TX terkirim : ${tx.hash}`);
        logger.detail(`Explorer   : ${this.walletService.explorer}/tx/${tx.hash}`);
        logger.info("Menunggu konfirmasi block...");
        return tx.wait();
    }

    _readABI(filename) {
        const path = `./contracts/${filename}`;
        try {
            return JSON.parse(readFileSync(path, "utf8"));
        } catch {
            throw new Error(`ABI file tidak ditemukan: ${path}`);
        }
    }
}