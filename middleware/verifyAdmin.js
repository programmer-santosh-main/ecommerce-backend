import Admin from "../models/adminModel.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin)
      return res.status(403).json({ message: "Admin verification failed." });
    req.admin = admin;
    next();
  } catch (error) {
    console.error("❌ verifyAdmin error:", error.message);
    res.status(500).json({ message: "Server error verifying admin." });
  }
};
