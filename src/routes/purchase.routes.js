const express = require("express");
const { getAllPurchases, createPurchase, approvePurchase, rejectPurchase } = require("../controllers/purchase.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/", getAllPurchases);
router.post("/", protect, createPurchase);
router.patch("/:id/approve", approvePurchase);
router.patch("/:id/reject", rejectPurchase);

module.exports = router;

