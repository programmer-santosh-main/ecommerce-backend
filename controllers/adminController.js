import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Create Admin
export const createAdmin = async (req, res) => {
  try {
    const { fullname, contact, email, password } = req.body;

    if (!fullname || !contact || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Email already in use." });

    const admin = await Admin.create({ fullname, contact, email, password });
    res.status(201).json({ message: "✅ Admin created successfully.", admin });
  } catch (error) {
    console.error("❌ createAdmin error:", error.message);
    res.status(500).json({ message: "Server error while creating admin." });
  }
};

// Get All Admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json({ admins });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching admins." });
  }
};

// Delete Admin
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });
    res.status(200).json({ message: "✅ Admin deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting admin." });
  }
};

// Edit Admin
export const updateAdmin = async (req, res) => {
  try {
    const { fullname, contact, email, password } = req.body;

    const updateData = { fullname, contact, email };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!admin) return res.status(404).json({ message: "Admin not found." });

    res.status(200).json({ message: "✅ Admin updated successfully.", admin });
  } catch (error) {
    res.status(500).json({ message: "Server error updating admin." });
  }
};

// Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(404).json({ message: "Admin not found." });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "✅ Login successful.",
      token,
      admin: {
        id: admin._id,
        fullname: admin.fullname,
        email: admin.email,
        contact: admin.contact,
      },
    });
  } catch (error) {
    console.error("❌ loginAdmin error:", error.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// Get Logged Admin
export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found." });
    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin profile." });
  }
};
