import express from "express";
import {
  createAdmin,
  deleteAdmin,
  updateAdmin,
  getAllAdmins,
  loginAdmin,
  getMe,
} from "../controllers/adminController.js";
import { adminAuth } from "../middleware/adminMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// Public
router.post("/login", loginAdmin);

// Protected
router.post("/add", adminAuth, verifyAdmin, createAdmin);
router.get("/all", adminAuth, verifyAdmin, getAllAdmins);
router.put("/:id", adminAuth, verifyAdmin, updateAdmin);
router.delete("/:id", adminAuth, verifyAdmin, deleteAdmin);
router.get("/me", adminAuth, verifyAdmin, getMe);

export default router;
