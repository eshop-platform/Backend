const express = require("express");
const {
  getAllProducts,
  getProductById,
  createProduct,
  submitProduct,
  updateProduct,
  approveProduct,
  rejectProduct,
  updateStock,
  deleteProduct,
  addReview,
} = require("../controllers/product.controller");
const { protect, adminOnly } = require("../middlewares/auth");
const { upload } = require("../utils/cloudinary");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Public submission (vendor/user)
router.post("/submit", upload.single("image"), submitProduct);

// Auth protected routes
router.post("/", protect, upload.single("image"), createProduct);
router.put("/:id", protect, updateProduct);
router.post("/:id/reviews", addReview);

// Admin only routes
router.patch("/:id/approve", protect, adminOnly, approveProduct);
router.patch("/:id/reject", protect, adminOnly, rejectProduct);
router.patch("/:id/stock", protect, adminOnly, updateStock);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
