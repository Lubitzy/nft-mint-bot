/**
 * ╔══════════════════════════════════════════════════╗
 * ║          NFT AUTO MINT BOT  v1.0.0              ║
 * ║     Multi-chain | SeaDrop | ERC721A Ready       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * @author  Lubi
 * @license MIT
 *
 * How to use:
 *   1. cp .env.example .env  →  fill in your keys
 *   2. Edit config/bot.config.js  →  set contract + phases
 *   3. Drop ABI into contracts/  →  update ABI_FILE in config
 *   4. npm start
 */

import { MintBot } from "./src/core/MintBot.js";

const bot = new MintBot();
bot.run();