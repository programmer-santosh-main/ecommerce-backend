import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// 🔑 Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  });
};
const clientUrls = process.env.CLIENT_URL.split(",").map(u => u.trim());
const primaryUrl = clientUrls[0].replace(/\/$/, ""); // use the first domain

// ✅ Register User
export const registerUser = async (req, res) => {
  try {
    const { fullname, contact, email, password } = req.body;

    if (!fullname || !contact || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      fullname,
      contact,
      email,
      password, // ⚡ store plain, pre-save hook will hash
      verificationToken,
      verificationTokenExpires: tokenExpiry,
      isVerified: false,
    });


    const verifyLink = `${primaryUrl}/verify/${verificationToken}`;

    await sendEmail(
      user.email,
      "Verify your email",
      `
        <h2>Hello ${user.fullname},</h2>
        <p>Click below to verify your account. This link will expire in <b>24 hours</b>.</p>
        <a href="${verifyLink}"
           style="display:inline-block;padding:10px 15px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">Verify My Email</a>
        <p>If you didn’t register, you can ignore this email.</p>
      `
    );

    res.status(201).json({
      message: "Registration successful. Please check your email to verify.",
    });
  } catch (err) {
    console.error("❌ registerUser error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// ✅ Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("❌ verifyEmail error:", err.message);
    res.status(500).json({ message: "Server error verifying email." });
  }
};

// ✅ Login (Email or Contact)
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { contact: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in. If you didnot still receive any emails - please contact on whatsapp +977 9866573177 or try registering again after 24 hours." });
    }

    // ✅ Validate password using bcrypt.compare()
    const isMatch = await import("bcryptjs").then((bcrypt) =>
      bcrypt.compare(password, user.password)
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        contact: user.contact,
      },
    });
  } catch (err) {
    console.error("❌ loginUser error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ✅ Get Logged-in User (Protected)
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user found." });
    }

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found or invalid token" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("❌ getMe error:", err.message);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};

// ✅ Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetLink = `${primaryUrl}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Reset Your Password",
      `
      <h2>Hello ${user.fullname},</h2>
      <p>You requested to reset your password.</p>
      <p>Click below to reset it. Valid for <b>15 minutes</b>.</p>
      <a href="${resetLink}" 
         style="display:inline-block;padding:10px 15px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">
         Reset Password
      </a>
      <p>If you didn’t request this, ignore this email.</p>
      `
    );

    res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (err) {
    console.error("❌ forgotPassword error:", err.message);
    res.status(500).json({ message: "Server error sending password reset email." });
  }
};

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // ⚡ Store plain password, pre-save hook hashes it
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful! You can now log in." });
  } catch (err) {
    console.error("❌ resetPassword error:", err.message);
    res.status(500).json({ message: "Server error resetting password." });
  }
};
