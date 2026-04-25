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
<<<<<<< HEAD
const { protect, adminOnly } = require("../middlewares/auth");
=======
const { protect } = require("../middlewares/auth");
const { upload } = require("../utils/cloudinary");
>>>>>>> eaa190191e9c5acb24a33802d88adb6be4c8fcff

const router = express.Router();

router.get("/", getAllProducts);
router.post("/submit", upload.single("image"), submitProduct);
router.get("/:id", getProductById);
router.post("/", protect, upload.single("image"), createProduct);
router.put("/:id", protect, updateProduct);
<<<<<<< HEAD
router.patch("/:id/approve", protect, adminOnly, approveProduct);
router.patch("/:id/reject", protect, adminOnly, rejectProduct);
router.patch("/:id/stock", protect, adminOnly, updateStock);
router.delete("/:id", protect, adminOnly, deleteProduct);
=======
router.post("/:id/reviews", addReview);
router.patch("/:id/approve", approveProduct);
router.patch("/:id/reject", rejectProduct);
router.patch("/:id/stock", updateStock);
router.delete("/:id", deleteProduct);
>>>>>>> eaa190191e9c5acb24a33802d88adb6be4c8fcff

module.exports = router;

