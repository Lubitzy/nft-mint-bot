/**
 * src/utils/logger.js
 * ──────────────────────────────────────────────────────────
 * Centralized logger:
 *   - Console output berwarna (chalk)
 *   - File log per sesi ke folder logs/ (winston)
 *
 * Import di file lain:
 *   import { logger } from "../utils/logger.js";
 */

import chalk from "chalk";
import winston from "winston";
import { existsSync, mkdirSync } from "fs";

// Pastikan folder logs/ ada
if (!existsSync("./logs")) mkdirSync("./logs", { recursive: true });

// Nama file log unik per sesi (berdasarkan timestamp)
const sessionStamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

// Winston — hanya ke file, tanpa warna
const fileLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) =>
            `[${timestamp}] [${level.toUpperCase().padEnd(7)}] ${message}`
        )
    ),
    transports: [
        new winston.transports.File({
            filename: `./logs/session-${sessionStamp}.log`,
        }),
    ],
});

export const logger = {

    title(msg) {
        const pad = "═".repeat(msg.length + 4);
        const line = `╔${pad}╗\n║  ${msg}  ║\n╚${pad}╝`;
        console.log("\n" + chalk.bold.magenta(line));
        fileLogger.info(`${"=".repeat(50)}`);
        fileLogger.info(`  ${msg}`);
        fileLogger.info(`${"=".repeat(50)}`);
    },

    info(msg) {
        console.log(chalk.cyan("  [INFO]   ") + msg);
        fileLogger.info(msg);
    },

    success(msg) {
        console.log(chalk.green("  [✓]      ") + msg);
        fileLogger.info(`[SUCCESS] ${msg}`);
    },

    warn(msg) {
        console.log(chalk.yellow("  [⚠]     ") + msg);
        fileLogger.warn(msg);
    },

    error(msg) {
        console.log(chalk.red("  [✗]     ") + msg);
        fileLogger.error(msg);
    },

    detail(msg) {
        console.log(chalk.gray(`           ${msg}`));
        fileLogger.info(`  → ${msg}`);
    },

    divider() {
        const line = "─".repeat(52);
        console.log(chalk.gray(`  ${line}`));
        fileLogger.info(line);
    },

};