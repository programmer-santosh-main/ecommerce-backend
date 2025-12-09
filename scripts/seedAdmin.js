import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "../models/adminModel.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("✅ Admin already exists, skipping seeding.");
      await mongoose.disconnect();
      process.exit(0);
    }

    const admin = await Admin.create({
      fullname: process.env.ADMIN_NAME,
      contact: process.env.ADMIN_CONTACT,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD, // pre-save hook hashes it
    });

    console.log(`✅ Admin created successfully: ${admin.email}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to seed admin:", err.message);
    process.exit(1);
  }
};

seedAdmin();
