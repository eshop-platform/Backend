const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes"); 
const orderRoutes = require("./routes/order.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes); 
app.use("/api/orders", orderRoutes);

// test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// error handler
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app;