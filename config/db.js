import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(
    "❌ Missing MONGO_URI in environment variables. Check your .env file."
  );
  process.exit(1);
}

const connectDB = async (retries = 5, delay = 3000) => {
  while (retries) {
    try {
      const conn = await mongoose.connect(MONGO_URI);

      console.log("=======================================");
      console.log(`✅ MongoDB Connected`);
      console.log(`🌐 Host: ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
      console.log("=======================================");

      // Graceful shutdown handler
      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("🛑 MongoDB connection closed due to app termination");
        process.exit(0);
      });

      break;
    } catch (error) {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      retries -= 1;

      if (retries === 0) {
        console.error("🚨 Could not connect to MongoDB. Exiting...");
        process.exit(1);
      }

      console.log(
        `🔁 Retrying in ${delay / 1000}s... (${retries} attempts left)`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

export default connectDB;
