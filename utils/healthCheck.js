// utils/healthCheck.js
// Periodically pings a target HEALTH_ROUTE to keep it warm / check availability.
// Uses global fetch if available (Node 18+), otherwise falls back to node-fetch.
// Exported API:
//   startHealthChecks({ intervalMs, timeoutMs, logger })
//   stopHealthChecks()

import { setInterval as _setInterval, clearInterval as _clearInterval } from "timers";

let intervalHandle = null;
let isRunning = false;

function getFetch() {
  // prefer global fetch (Node 18+). If not present, try to require node-fetch.
  if (typeof fetch !== "undefined") return fetch;
  try {
    // eslint-disable-next-line global-require
    const nodeFetch = require("node-fetch");
    return nodeFetch;
  } catch (err) {
    throw new Error(
      "No fetch available. Use Node 18+ or install node-fetch (npm i node-fetch)."
    );
  }
}

/**
 * Performs a single health check fetch with timeout.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<{ok:boolean, status:number|null, duration:number, error?:string}>}
 */
export async function performHealthCheck(url, timeoutMs = 15_000) {
  const fetchFn = getFetch();
  const start = Date.now();

  // AbortController for timeout
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeoutId;
  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const res = await fetchFn(url, {
      method: "GET",
      signal: controller ? controller.signal : undefined,
      // optional: add a short cache-busting query param to avoid cached responses
      // headers: { 'User-Agent': 'health-check/1.0' }
    });

    const duration = Date.now() - start;
    if (timeoutId) clearTimeout(timeoutId);

    return { ok: res.ok, status: res.status, duration };
  } catch (err) {
    const duration = Date.now() - start;
    if (timeoutId) clearTimeout(timeoutId);

    // differentiate abort vs other errors
    const errMsg = err?.name === "AbortError" ? "timeout" : (err?.message || String(err));
    return { ok: false, status: null, duration, error: errMsg };
  }
}

/**
 * Start periodic health checks.
 * @param {object} opts
 * @param {string} opts.url - required target URL (from env HEALTH_ROUTE)
 * @param {number} [opts.intervalMs=180000] - ping interval in ms (default 3 minutes)
 * @param {number} [opts.timeoutMs=15000] - per-request timeout in ms
 * @param {function} [opts.logger=console.log] - logger function; can accept multiple args
 */
export function startHealthChecks({
  url,
  intervalMs = 180_000,
  timeoutMs = 15_000,
  logger = console.log,
} = {}) {
  if (!url) {
    throw new Error("startHealthChecks: url is required (pass HEALTH_ROUTE).");
  }
  if (isRunning) {
    logger("healthCheck: already running");
    return;
  }

  isRunning = true;

  // Run immediately once, then on interval
  (async () => {
    logger(`[healthCheck] initial ping -> ${url}`);
    const result = await performHealthCheck(url, timeoutMs);
    if (result.ok) {
      logger(`[healthCheck] initial success (${result.status}) ${result.duration}ms`);
    } else {
      logger(`[healthCheck] initial failed (${result.error || "error"}) ${result.duration}ms`);
    }
  })().catch((e) => logger("[healthCheck] initial error:", e?.message || e));

  intervalHandle = _setInterval(async () => {
    try {
      logger(`[healthCheck] ping -> ${url}`);
      const result = await performHealthCheck(url, timeoutMs);
      if (result.ok) {
        logger(`[healthCheck] success (${result.status}) ${result.duration}ms`);
      } else {
        logger(`[healthCheck] failed (${result.error || "error"}) ${result.duration}ms`);
      }
    } catch (err) {
      logger("[healthCheck] unexpected error:", err?.message || err);
    }
  }, intervalMs);

  logger(`[healthCheck] started; interval=${intervalMs}ms, timeout=${timeoutMs}ms`);
}

/** Stop running health checks (useful in tests or graceful shutdown) */
export function stopHealthChecks() {
  if (intervalHandle) {
    _clearInterval(intervalHandle);
    intervalHandle = null;
  }
  isRunning = false;
}
