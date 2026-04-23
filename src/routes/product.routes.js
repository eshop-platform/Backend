const express = require("express");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  approveProduct,
  rejectProduct,
  updateStock,
  deleteProduct,
} = require("../controllers/product.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.patch("/:id/approve", approveProduct);
router.patch("/:id/reject", rejectProduct);
router.patch("/:id/stock", updateStock);
router.delete("/:id", deleteProduct);

module.exports = router;

