const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { isDbReady } = require("./config/db");

const app = express();

// Security headers
app.use(helmet());

const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
  "https://frontend-one-smoky-28.vercel.app",
  "https://ecommerce-team4.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGINS)
]);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser requests without Origin (curl/Postman/health checks)
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

// CORS must be before routes
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const chapaRoutes = require("./routes/chapa.routes");
const aiRoutes = require("./routes/ai.routes");

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isDbReady() ? "connected" : "degraded"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chapa", chapaRoutes);
app.use("/api/ai", aiRoutes);

// Error handler must be last
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app;
