const Purchase = require("../models/purchase.model");

// GET /api/purchases  — admin view all, supports ?status=
exports.getAllPurchases = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const purchases = await Purchase.find(filter)
      .populate("buyer", "username email")
      .populate("products.product", "name price image")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    next(error);
  }
};

// POST /api/purchases  — create a purchase after Chapa payment verified
exports.createPurchase = async (req, res, next) => {
  try {
    const { products, totalAmount, txRef } = req.body;
    if (!products || !totalAmount) {
      return res.status(400).json({ success: false, message: "products and totalAmount are required" });
    }
    const commission = parseFloat((totalAmount * 0.05).toFixed(2));
    const purchase = await Purchase.create({
      buyer: req.user._id,
      products,
      totalAmount,
      commission,
      status: "completed",
      txRef,
    });
    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/purchases/:id/approve
exports.approvePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, { status: "completed" }, { new: true });
    if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/purchases/:id/reject
exports.rejectPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};


