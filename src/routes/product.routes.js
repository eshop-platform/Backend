const express = require("express");
const { getAllProducts, approveProduct, rejectProduct, updateStock, deleteProduct } = require("../controllers/product.controller");

const router = express.Router();

router.get("/", getAllProducts);
router.patch("/:id/approve", approveProduct);
router.patch("/:id/reject", rejectProduct);
router.patch("/:id/stock", updateStock);
router.delete("/:id", deleteProduct);

module.exports = router;
