import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        console.warn("⚠️ Invalid user from token");
        return res.status(404).json({ success: false, message: "User not found" });
      }
      next();
    } catch (err) {
      console.error("❌ JWT verification failed:", err.message);
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  } else {
    console.warn("🚫 No authorization header found");
    res.status(401).json({ success: false, message: "No token, authorization denied" });
  }
};

