const express = require("express");
const { getAllPurchases, createPurchase, approvePurchase, rejectPurchase } = require("../controllers/purchase.controller");
const { protect, adminOnly } = require("../middlewares/auth");

const router = express.Router();

router.get("/", protect, adminOnly, getAllPurchases);
router.post("/", protect, createPurchase);
router.patch("/:id/approve", protect, adminOnly, approvePurchase);
router.patch("/:id/reject", protect, adminOnly, rejectPurchase);

module.exports = router;

