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
const { protect } = require("../middlewares/auth");
const { upload } = require("../utils/cloudinary");

const router = express.Router();

router.get("/", getAllProducts);
router.post("/submit", upload.single("image"), submitProduct);
router.get("/:id", getProductById);
router.post("/", protect, upload.single("image"), createProduct);
router.put("/:id", protect, updateProduct);
router.post("/:id/reviews", addReview);
router.patch("/:id/approve", approveProduct);
router.patch("/:id/reject", rejectProduct);
router.patch("/:id/stock", updateStock);
router.delete("/:id", deleteProduct);

module.exports = router;

