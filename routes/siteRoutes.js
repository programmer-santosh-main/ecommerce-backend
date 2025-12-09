import express from "express";
import { getSiteConfig, updateSiteConfig } from "../controllers/siteController.js";
import { adminAuth } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public route - anyone can get site data
router.get("/", getSiteConfig);

// Protected route - admin can update
router.put("/update", adminAuth, updateSiteConfig);

export default router;
