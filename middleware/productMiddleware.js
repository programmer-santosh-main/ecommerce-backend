import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(403).json({ message: "Invalid admin token." });

    req.admin = admin;
    next();
  } catch (error) {
    console.error("❌ verifyAdminToken error:", error.message);
    res.status(403).json({ message: "Invalid or expired admin token." });
  }
};
