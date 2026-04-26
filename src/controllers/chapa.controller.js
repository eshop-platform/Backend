const Purchase = require("../models/purchase.model");
const Product = require("../models/product.model");

const CHAPA_BASE_URL = "https://api.chapa.co/v1";
const SUCCESS_STATUSES = new Set(["success", "successful", "completed"]);

const parseChapaStatus = (responseData) =>
  String(responseData?.data?.status || responseData?.status || "").toLowerCase();

const verifyWithChapa = async (txRef) => {
  const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: {
      Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    },
  });

  const responseData = await response.json().catch(() => ({}));
  return { response, responseData };
};

// POST /api/chapa/initialize
exports.initializePayment = async (req, res) => {
  try {
    const { txRef, amount, firstName, lastName, email, phone, productName, productId, products } = req.body;

    if (!txRef || !amount || !firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: "Missing required payment fields" });
    }
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Authentication required to initialize payment" });
    }

    let purchaseProducts = [];
    let totalCommission = 0;

    if (products && Array.isArray(products) && products.length > 0) {
      for (const item of products) {
        const productIdToFind = item.product || item.id;
        const p = productIdToFind ? await Product.findById(productIdToFind) : null;
        const price = Number(p ? p.price : item.price || 0);
        const qty = Number(item.quantity || 1);

        if (productIdToFind) {
          purchaseProducts.push({ product: p ? p._id : productIdToFind, quantity: qty, price });
        }

        totalCommission += price * qty * 0.05;
      }
    } else if (productId) {
      const p = await Product.findById(productId);
      const price = Number(p ? p.price : amount);
      purchaseProducts.push({ product: productId, quantity: 1, price });
      totalCommission = price * 0.05;
    }

    await Purchase.findOneAndUpdate(
      { txRef },
      {
        txRef,
        buyer: req.user._id,
        products: purchaseProducts,
        totalAmount: Number(amount),
        commission: Number(totalCommission.toFixed(2)),
        status: "pending",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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
        message: `Chapa error: ${responseData?.message || "Unable to initialize payment"}`,
      });
    }

    const checkoutUrl = responseData?.data?.checkout_url;
    if (!checkoutUrl) {
      return res.status(502).json({ success: false, message: "Chapa did not return a checkout URL" });
    }

    return res.status(200).json({ success: true, checkoutUrl });
  } catch (error) {
    console.error("Chapa Initialization Error:", error.message);
    return res.status(502).json({ success: false, message: `Chapa error: ${error.message}` });
  }
};

// GET /api/chapa/verify/:txRef
exports.verifyPayment = async (req, res) => {
  try {
    const { txRef } = req.params;
    if (!txRef) return res.status(400).json({ success: false, message: "txRef is required" });

    if (!process.env.CHAPA_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "CHAPA_SECRET_KEY is not configured." });
    }

    const { response, responseData } = await verifyWithChapa(txRef);
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: `Chapa verify error: ${responseData?.message || "Unable to verify payment"}`,
      });
    }

    const status = parseChapaStatus(responseData);
    const isSuccess = SUCCESS_STATUSES.has(status);

    const purchase = await Purchase.findOneAndUpdate(
      { txRef },
      { status: isSuccess ? "completed" : "pending" },
      { new: true }
    );

    return res.status(200).json({ success: true, chapa: responseData, purchase });
  } catch (error) {
    return res.status(502).json({ success: false, message: `Chapa verify error: ${error.message}` });
  }
};

// POST /api/chapa/webhook
exports.webhook = async (req, res) => {
  try {
    if (!process.env.CHAPA_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "CHAPA_SECRET_KEY is not configured." });
    }

    const txRef =
      req.body?.tx_ref ||
      req.body?.trx_ref ||
      req.body?.reference ||
      req.body?.data?.tx_ref ||
      req.body?.data?.trx_ref;

    if (!txRef) {
      return res.status(400).json({ success: false, message: "tx_ref not found in webhook payload" });
    }

    const { response, responseData } = await verifyWithChapa(txRef);
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: `Chapa webhook verify error: ${responseData?.message || "Unable to verify payment"}`,
      });
    }

    const status = parseChapaStatus(responseData);
    const isSuccess = SUCCESS_STATUSES.has(status);

    await Purchase.findOneAndUpdate(
      { txRef },
      { status: isSuccess ? "completed" : "pending" }
    );

    return res.status(200).json({ success: true, received: true, txRef, status });
  } catch (error) {
    return res.status(502).json({ success: false, message: `Webhook error: ${error.message}` });
  }
};
