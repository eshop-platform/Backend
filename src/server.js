require("dotenv").config();

const express = require("express");
const app = express();
const connectDB = require("./config/db");

// middleware
app.use(express.json());

// routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/products", require("./routes/product.routes"));

// test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// connect DB
connectDB();

//  FORCE LISTEN
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(" SERVER STARTED");
  console.log(` http://localhost:${PORT}`);
});