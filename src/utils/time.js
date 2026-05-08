/**
 * src/utils/time.js
 * ──────────────────────────────────────────────────────────
 * Helper fungsi untuk kalkulasi waktu, countdown, formatting.
 */

/**
 * Hitung sisa waktu dari sekarang ke target
 * @param   {Date}   target
 * @returns {string} format "02:30:15"
 */
export function timeUntil(target) {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return "00:00:00";

    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);

    return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

/**
 * Format Date ke string WIB (Asia/Jakarta)
 * @param   {Date}   date
 * @returns {string} "08 Mei 2026, 00:00:00 WIB"
 */
export function toWIB(date) {
    return date.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }) + " WIB";
}

/**
 * Promise-based sleep
 * @param {number} ms - milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cek apakah sebuah Date masih di masa depan
 * @param   {Date}    date
 * @returns {boolean}
 */
export function isFuture(date) {
    return date.getTime() > Date.now();
}