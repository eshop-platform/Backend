const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// CONNECT DATABASE
connectDB();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const errorHandler = require("./middlewares/errorHandler");

app.use(errorHandler);