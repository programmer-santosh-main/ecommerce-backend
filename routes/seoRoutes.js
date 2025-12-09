// routes/seoRoutes.js
import express from "express";
import {
  getSeoByPage,
  getAllSeos,
  createSeo,
  updateSeo,
  deleteSeo,
} from "../controllers/seoController.js";
import { adminAuth } from "../middleware/adminMiddleware.js"; // adjust import path if needed

const router = express.Router();

// Public endpoint (used by frontend)
router.get("/page/:page", getSeoByPage);

// Admin CRUD endpoints (protected)
router.get("/", adminAuth, getAllSeos);
router.post("/", adminAuth, createSeo);
router.put("/:id", adminAuth, updateSeo);
router.delete("/:id", adminAuth, deleteSeo);

export default router;
