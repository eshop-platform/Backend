const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const Order = require("../models/order.model");
const Product = require("../models/product.model");


// CREATE ORDER
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    let totalPrice = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const quantity = item.quantity || 1;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity
      });

      totalPrice += product.price * quantity;
    }

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      totalPrice
    });

    const saved = await order.save();

    res.status(201).json(saved);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET MY ORDERS
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//  ADMIN: GET ALL ORDERS
router.get("/admin/all", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//  UPDATE ORDER STATUS (ADMIN)
router.put("/:id/status", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["pending", "paid", "shipped", "completed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//  CANCEL ORDER (USER)
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Not found" });

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not yours" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Cannot cancel this order" });
    }

    order.status = "cancelled";

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;