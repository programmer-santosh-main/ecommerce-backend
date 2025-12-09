import express from "express";
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { adminAuth } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// USER ROUTES
router.post("/create",protect, createOrder);
router.get("/my-orders", protect, getUserOrders);

// ADMIN ROUTES
router.get("/", adminAuth, getAllOrders);
router.put("/:id", adminAuth, updateOrder);
router.delete("/:id", adminAuth, deleteOrder);

export default router;
