const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); 
    console.log("🚀 MongoDB connected successfully");
  } catch (error) {
    console.error("❌ DB connection error:", error.message);
    
    if (process.env.MONGO_URI.includes('mongodb.net')) {
      console.error("👉 ATLAS TIP: Ensure your IP is whitelisted in MongoDB Atlas: https://www.mongodb.com/docs/atlas/security-whitelist/");
    } else if (process.env.MONGO_URI.includes('127.0.0.1') || process.env.MONGO_URI.includes('localhost')) {
      console.error("👉 LOCAL TIP: Ensure your local MongoDB service is STARTED. Run 'Start-Service MongoDB' in Admin PowerShell.");
    }
  }
};

module.exports = connectDB;