const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { isDbReady } = require("./config/db");

const app = express();

// Security headers
app.use(helmet());

// CORS — allow both frontend (5173) and admin (5174)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Routes
const authRoutes      = require("./routes/auth.routes");
const userRoutes      = require("./routes/user.routes");
const categoryRoutes  = require("./routes/category.routes");
const productRoutes   = require("./routes/product.routes");
const purchaseRoutes  = require("./routes/purchase.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const chapaRoutes     = require("./routes/chapa.routes");
const aiRoutes        = require("./routes/ai.routes");

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    database: isDbReady() ? "connected" : "degraded"
  });
});

app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products",   productRoutes);
app.use("/api/purchases",  purchaseRoutes);
app.use("/api/dashboard",  dashboardRoutes);
app.use("/api/chapa",      chapaRoutes);
app.use("/api/ai",         aiRoutes);

// error handler (always last)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app;
