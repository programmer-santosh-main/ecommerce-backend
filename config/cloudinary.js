import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

try {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "❌ Missing Cloudinary environment variables. Please check your .env file."
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  const testConnection = async () => {
    try {
      await cloudinary.api.ping();
      console.log("✅ Cloudinary connected successfully.");
    } catch (error) {
      console.error("🚨 Cloudinary connection failed:", error.message);
    }
  };

  testConnection();
} catch (error) {
  console.error("🚨 Cloudinary configuration error:", error.message);
}

export default cloudinary;
