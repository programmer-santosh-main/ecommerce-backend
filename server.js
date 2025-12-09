// server.js (updated CORS handling)
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { cleanupUnverifiedUsers } from "./utils/cleanupUnverified.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sliderRoutes from "./routes/sliderRoutes.js";
import siteRoutes from "./routes/siteRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { startHealthChecks, stopHealthChecks } from "./utils/healthCheck.js";
import sitemapRoutes from "./routes/sitemapRoutes.js";

dotenv.config();
connectDB();

const app = express();
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

// Build allowedOrigins array from env; accept comma-separated values
const rawClientEnv = process.env.CLIENT_URL || "";
const allowedOrigins = rawClientEnv
  .split(",")
  .map((u) => (u || "").trim())
  .filter(Boolean)
  // normalize by removing trailing slash if present
  .map((u) => u.replace(/\/$/, ""));

// Always allow common local dev origin if not explicitly present
if (!allowedOrigins.includes("http://localhost:5173")) {
  allowedOrigins.push("http://localhost:5173");
}

// Helper: normalize incoming origin and allowed list
const normalizeOrigin = (origin) => (origin ? origin.replace(/\/$/, "") : origin);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true }));

// Robust CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      const incoming = normalizeOrigin(origin);

      // Accept if exact match in allowedOrigins
      if (allowedOrigins.includes(incoming)) {
        return callback(null, true);
      }

      // Accept if allowedOrigins contains wildcard '*' (use with care)
      if (allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      // Accept nip.io style hostnames automatically (common for raw IP + nip.io)
      // If you don't want this behavior, remove this block.
      if (incoming.endsWith(".nip.io")) {
        return callback(null, true);
      }

      // Accept subdomain patterns in allowedOrigins like ".example.com" or "*.example.com"
      const matchesPattern = allowedOrigins.some((a) => {
        if (a.startsWith("*.")) {
          return incoming.endsWith(a.slice(1)); // a = *.example.com -> check .example.com
        }
        if (a.startsWith(".")) {
          return incoming.endsWith(a); // a = .example.com -> check .example.com
        }
        return false;
      });
      if (matchesPattern) {
        return callback(null, true);
      }

      // Not allowed
      console.log("❌ CORS Blocked Origin:", origin);
      return callback(new Error("Not allowed by CORS: " + origin), false);
    },
    // Allow cookies/credentials
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200, // some legacy browsers choke on 204 for OPTIONS
  })
);

// Make sure preflight OPTIONS requests are handled (explicitly)
app.options("*", (req, res) => {
  // cors middleware already set appropriate headers for allowed origins,
  // but respond to OPTIONS quickly.
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  console.log("📡 Health check endpoint hit successfully");
  res.status(200).send("✅ Admin API is running smoothly...");
});

setInterval(async () => {
  console.log(`[${new Date().toISOString()}] 🧹 Running scheduled cleanup...`);
  await cleanupUnverifiedUsers();
}, TWELVE_HOURS);

/* --- routes --- */
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/seo", seoRoutes);
app.use("/", sitemapRoutes);
app.use("/health", healthRoutes);

/* 404 handler */
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "❌ Route not found." });
});

/* global error handler */
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler Triggered:");
  console.error(`   • Message: ${err.message}`);
  console.error(`   • Stack: ${err.stack}`);
  // if err is a CORS error thrown by our origin function, respond 403
  if (err.message && err.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log("=======================================");
  console.log(`✅ Server started successfully`);
  console.log(`📡 Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🧩 Client URL(s): ${allowedOrigins.join(", ") || "localhost"}`);
  console.log("=======================================");

  try {
    const healthUrl = process.env.HEALTH_ROUTE;
    const intervalMs = process.env.HEALTH_INTERVAL_MS ? Number(process.env.HEALTH_INTERVAL_MS) : 100000;
    const timeoutMs = process.env.HEALTH_TIMEOUT_MS ? Number(process.env.HEALTH_TIMEOUT_MS) : 20000;

    if (healthUrl) {
      startHealthChecks({ url: healthUrl, intervalMs, timeoutMs, logger: console.log });
    } else {
      console.log("HEALTH_ROUTE not set; health checks are disabled.");
    }
  } catch (err) {
    console.error("Failed to start health checks:", err?.message || err);
  }
});

/* unhandled rejections / exceptions (unchanged) */
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Promise Rejection:", err?.message || err);
  try {
    stopHealthChecks();
  } catch (e) {
    console.error("Error stopping health checks:", e?.message || e);
  }
  setTimeout(() => process.exit(1), 100);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err?.message || err);
  console.error(err?.stack || "");
  try {
    stopHealthChecks();
  } catch (e) {
    console.error("Error stopping health checks:", e?.message || e);
  }
  setTimeout(() => process.exit(1), 100);
});

const gracefulShutdown = async (signal) => {
  try {
    console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
    try {
      stopHealthChecks();
      console.log("🧭 Health checks stopped.");
    } catch (e) {
      console.warn("Could not stop health checks cleanly:", e?.message || e);
    }

    server.close((err) => {
      if (err) {
        console.error("Error closing server:", err);
        process.exit(1);
      }
      console.log("✅ Server closed.");
      process.exit(0);
    });

    setTimeout(() => {
      console.warn("⚠ Could not close connections in time, forcing shutdown.");
      process.exit(1);
    }, 10_000);
  } catch (err) {
    console.error("Error during graceful shutdown:", err?.message || err);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
