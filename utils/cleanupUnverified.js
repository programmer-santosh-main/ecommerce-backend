import User from "../models/userModel.js";

export const cleanupUnverifiedUsers = async () => {
  try {
    const result = await User.deleteMany({
      isVerified: false,
      verificationTokenExpires: { $lt: Date.now() - 7 * 24 * 60 * 60 * 1000 }, // 7 days old
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} unverified accounts`);
    }
  } catch (err) {
    console.error("❌ Error cleaning up unverified users:", err.message);
  }
};
