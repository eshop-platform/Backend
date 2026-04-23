const express = require("express");
const { getAllPurchases, approvePurchase, rejectPurchase } = require("../controllers/purchase.controller");

const router = express.Router();

router.get("/", getAllPurchases);
router.patch("/:id/approve", approvePurchase);
router.patch("/:id/reject", rejectPurchase);

module.exports = router;
