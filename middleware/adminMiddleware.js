import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Access denied. No token." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.adminId = decoded.id;
    next();
  } catch (error) {
    console.error("⚠️ adminAuth error:", error.message);
    res.status(403).json({ message: "Invalid or expired token." });
  }
};
