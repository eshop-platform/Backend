const express = require("express");
const {
  generateProductDraft,
  shoppingAssistantChat,
  suggestDynamicPrice,
} = require("../controllers/ai.controller");
const { upload } = require("../utils/cloudinary");

const router = express.Router();

router.post("/product-draft", upload.single("image"), generateProductDraft);
router.post("/pricing", suggestDynamicPrice);
router.post("/chat", shoppingAssistantChat);

module.exports = router;
