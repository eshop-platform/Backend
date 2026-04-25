const mongoose = require("mongoose");

let dbReady = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    dbReady = true;
    console.log("MongoDB connected");
  } catch (error) {
    dbReady = false;
    console.error("DB connection error:", error);
  }
};

const isDbReady = () => dbReady && mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbReady };
