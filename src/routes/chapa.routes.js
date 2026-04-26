const express = require("express");
const { initializePayment, verifyPayment, webhook } = require("../controllers/chapa.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.post("/initialize", protect, initializePayment);
router.get("/verify/:txRef", verifyPayment);
router.post("/webhook", webhook);

module.exports = router;
