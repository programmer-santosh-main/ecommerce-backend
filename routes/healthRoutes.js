// routes/healthRoutes.js
import express from "express";

const router = express.Router();

/**
 * GET /health
 * Simple health endpoint for monitoring.
 * Responds with JSON: { status: 'ok', uptime, timestamp }
 */
router.get("/", (req, res) => {
  const uptimeSeconds = process.uptime();
  res.json({
    status: "ok",
    uptime: Math.floor(uptimeSeconds),
    timestamp: new Date().toISOString(),
  });
});

export default router;
