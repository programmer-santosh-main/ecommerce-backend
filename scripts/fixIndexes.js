import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔧 Connected. Dropping invalid index...");

    await User.collection.dropIndex("username_1");
    console.log("✅ Dropped 'username_1' index.");

    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

fixIndexes();
