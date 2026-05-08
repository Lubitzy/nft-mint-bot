/**
 * src/services/PhaseService.js
 * ──────────────────────────────────────────────────────────
 * Tanggung jawab SATU:
 *   Semua hal yang berkaitan dengan jadwal & timing mint.
 *
 *   ✅ Tampilkan semua phase dengan status
 *   ✅ Pilih phase yang eligible & belum expired
 *   ✅ Countdown real-time sampai window terbuka
 *
 *   ❌ Tidak tahu soal contract
 *   ❌ Tidak tahu soal wallet
 */

import chalk from "chalk";
import { logger } from "../utils/logger.js";
import { timeUntil, toWIB, sleep } from "../utils/time.js";

export class PhaseService {

    constructor(phases, pollIntervalMs = 500) {
        this.phases = phases;
        this.pollIntervalMs = pollIntervalMs;
    }

    /**
     * Cetak semua phase dan statusnya ke console
     */
    printSchedule() {
        logger.title("MINT SCHEDULE");

        this.phases.forEach((phase, i) => {
            const now = new Date();
            const isOpen = now >= phase.startTime && now <= phase.endTime;
            const isExpired = now > phase.endTime;

            // Status badge
            let badge;
            if (!phase.eligible) badge = chalk.white("  ❌ NOT ELIGIBLE  ");
            else if (isExpired) badge = chalk.bgGray.white("    EXPIRED     ");
            else if (isOpen) badge = chalk.white("  🟢  OPEN NOW  ");
            else badge = chalk.white("  ✅ ELIGIBLE   ");

            // Countdown
            const countdown = isExpired
                ? chalk.gray("Sudah lewat")
                : isOpen
                    ? chalk.green("SEDANG BUKA!")
                    : chalk.yellow(`${timeUntil(phase.startTime)}`);

            console.log(`\n  ${i + 1}. ${chalk.bold.white(phase.name)}  ${badge}`);
            console.log(`     - Harga  : ${phase.priceEth || "0"} ETH`);
            console.log(`     - Max    : ${phase.maxPerWallet} per wallet`);
            console.log(`     - Buka   : ${toWIB(phase.startTime)}`);
            console.log(`     - Tutup  : ${toWIB(phase.endTime)}`);
            console.log(`     - Sisa   : ${countdown}`);
        });

        console.log();
        logger.divider();
    }

    /**
     * Pilih phase eligible yang belum expired
     * @returns {object} phase yang akan di-target
     */
    selectTargetPhase() {
        const now = new Date();
        const target = this.phases.find(p => p.eligible && now <= p.endTime);

        if (!target) {
            throw new Error(
                "Tidak ada phase eligible yang tersedia!\n" +
                "Cek config/bot.config.js → PHASES → eligible: true"
            );
        }

        logger.success(`Target phase : ${chalk.bold.cyan(target.name)}`);
        logger.detail(`Buka   : ${toWIB(target.startTime)}`);
        logger.detail(`Harga  : ${target.priceEth || "0"} ETH`);
        logger.detail(`Max    : ${target.maxPerWallet} per wallet`);
        logger.divider();

        return target;
    }

    /**
     * Tunggu sampai mint window terbuka dengan countdown real-time
     * @param   {object}  phase
     * @returns {boolean} true = bisa mint, false = sudah expired
     */
    async waitForWindow(phase) {
        const now = new Date();

        // Window sudah terbuka sekarang
        if (now >= phase.startTime && now <= phase.endTime) {
            logger.success("Mint window sudah TERBUKA! Langsung eksekusi...");
            return true;
        }

        // Window sudah lewat
        if (now > phase.endTime) {
            logger.error("Mint phase sudah berakhir!");
            return false;
        }

        // Countdown
        logger.title("MENUNGGU MINT WINDOW");
        logger.info(`Phase  : ${phase.name}`);
        logger.info(`Target : ${toWIB(phase.startTime)}`);
        console.log();

        while (true) {
            const remaining = phase.startTime.getTime() - Date.now();

            if (remaining <= 0) {
                process.stdout.write("\n\n");
                logger.success("🚀 MINT WINDOW TERBUKA! EKSEKUSI SEKARANG!");
                logger.divider();
                return true;
            }

            process.stdout.write(
                chalk.yellow(`\r  ⏰ Countdown : ${chalk.bold(timeUntil(phase.startTime))}   `)
            );

            // Poll setiap detik, tapi lebih cepat kalau < 10 detik
            await sleep(remaining > 10_000 ? 1_000 : this.pollIntervalMs);
        }
    }
}