const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Routes
const userRoutes = require("./routes/user.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const aiRoutes = require("./routes/ai.routes");

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

// error handler (always last)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app; // 👈 VERY IMPORTANT
