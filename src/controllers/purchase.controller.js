const Purchase = require("../models/purchase.model");

exports.getAllPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find()
      .populate("buyer", "username email")
      .populate("products.product", "name price");
    res.status(200).json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    next(error);
  }
};

exports.approvePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

exports.rejectPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};
