const mongoose = require("mongoose");

let dbReady = false;

const connectDB = async () => {
  try {
<<<<<<< HEAD
    await mongoose.connect(process.env.MONGO_URI); 
    console.log("🚀 MongoDB connected successfully");
  } catch (error) {
    console.error("❌ DB connection error:", error.message);
    
    if (process.env.MONGO_URI.includes('mongodb.net')) {
      console.error("👉 ATLAS TIP: Ensure your IP is whitelisted in MongoDB Atlas: https://www.mongodb.com/docs/atlas/security-whitelist/");
    } else if (process.env.MONGO_URI.includes('127.0.0.1') || process.env.MONGO_URI.includes('localhost')) {
      console.error("👉 LOCAL TIP: Ensure your local MongoDB service is STARTED. Run 'Start-Service MongoDB' in Admin PowerShell.");
    }
=======
    await mongoose.connect(process.env.MONGO_URI);
    dbReady = true;
    console.log("MongoDB connected");
  } catch (error) {
    dbReady = false;
    console.error("DB connection error:", error);
>>>>>>> eaa190191e9c5acb24a33802d88adb6be4c8fcff
  }
};

const isDbReady = () => dbReady && mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbReady };
