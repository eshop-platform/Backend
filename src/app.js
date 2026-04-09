const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// error handler (always last)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app; // 👈 VERY IMPORTANT