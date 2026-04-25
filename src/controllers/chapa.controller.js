<<<<<<< HEAD
const axios = require("axios");
const Purchase = require("../models/purchase.model");
const Product = require("../models/product.model");

=======
>>>>>>> eaa190191e9c5acb24a33802d88adb6be4c8fcff
const CHAPA_BASE_URL = "https://api.chapa.co/v1";

// POST /api/chapa/initialize
exports.initializePayment = async (req, res, next) => {
  try {
    const { txRef, amount, firstName, lastName, email, phone, productName, productId, products } = req.body;

    if (!txRef || !amount || !firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: "Missing required payment fields" });
    }

    // 1. Prepare products and commission
    let purchaseProducts = [];
    let totalCommission = 0;

    if (products && Array.isArray(products)) {
      // Cart checkout
      for (const item of products) {
        const p = await Product.findById(item.product || item.id);
        const price = p ? p.price : item.price;
        const qty = item.quantity || 1;
        purchaseProducts.push({ product: p ? p._id : item.id, quantity: qty, price });
        totalCommission += (price * qty) * 0.05;
      }
    } else if (productId) {
      // Single product buy
      const p = await Product.findById(productId);
      const price = p ? p.price : amount;
      purchaseProducts.push({ product: productId, quantity: 1, price });
      totalCommission = price * 0.05;
    }

    // 2. Create a pending purchase record
    await Purchase.create({
      txRef,
      buyer: req.user ? req.user.id : null,
      products: purchaseProducts,
      totalAmount: amount,
      commission: totalCommission,
      status: "pending",
      customerInfo: { firstName, lastName, email, phone }
    });

    // 3. Prepare Chapa payload
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const returnUrl = `${FRONTEND_URL}/cart?tx_ref=${encodeURIComponent(txRef)}&payment=success`;

    const payload = {
      amount: String(amount),
      currency: "ETB",
      email,
      first_name: firstName,
      last_name: lastName,
      phone_number: phone || "",
      tx_ref: txRef,
      callback_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/chapa/webhook`,
      return_url: returnUrl,
      customization: {
        title: "PrimeCommerce",
        description: productName || "Order Payment",
      },
    };

    if (!process.env.CHAPA_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "CHAPA_SECRET_KEY is not configured." });
    }

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: `Chapa error: ${responseData?.message || "Unable to initialize payment"}`
      });
    }

    const checkoutUrl = responseData?.data?.checkout_url;
    if (!checkoutUrl) {
      return res.status(502).json({ success: false, message: "Chapa did not return a checkout URL" });
    }

    res.status(200).json({ success: true, checkoutUrl });
  } catch (error) {
<<<<<<< HEAD
    console.error("Chapa Initialization Error:", error.response?.data || error.message);
    const chapaMessage = error.response?.data?.message || error.message;
    res.status(502).json({ success: false, message: `Chapa error: ${chapaMessage}` });
=======
    res.status(502).json({ success: false, message: `Chapa error: ${error.message}` });
>>>>>>> eaa190191e9c5acb24a33802d88adb6be4c8fcff
  }
};



// GET /api/chapa/verify/:txRef
exports.verifyPayment = async (req, res, next) => {
  try {
    const { txRef } = req.params;
    if (!txRef) return res.status(400).json({ success: false, message: "txRef is required" });

    if (!process.env.CHAPA_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "CHAPA_SECRET_KEY is not configured." });
    }

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
    });

    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: `Chapa verify error: ${responseData?.message || "Unable to verify payment"}`
      });
    }

    res.status(200).json({ success: true, chapa: responseData });
  } catch (error) {
    res.status(502).json({ success: false, message: `Chapa verify error: ${error.message}` });
  }
};

// POST /api/chapa/webhook  — Chapa calls this after payment
exports.webhook = async (req, res) => {
  // Acknowledge immediately
  res.status(200).json({ received: true });
};
