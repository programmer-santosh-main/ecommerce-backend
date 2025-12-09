import express from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js"; 
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.get("/verify/:token", verifyEmail);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword); 
router.post("/reset-password/:token", resetPassword); 

// Protected route
router.get("/me", protect, getMe);

export default router;
