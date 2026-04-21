const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const Product = require("../models/product.model");


// ✅ CREATE PRODUCT
router.post("/", authMiddleware, async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      status: "pending",
      user: req.user.id
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ GET MY PRODUCTS
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔥 UPDATE PRODUCT (Edit / Re-submit)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Not found" });

    // ownership check
    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not yours" });
    }

    // 🔥 ONLY pending or rejected can be edited
    if (!["pending", "rejected"].includes(product.status)) {
      return res.status(400).json({ message: "Cannot edit this product" });
    }

    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.description = req.body.description || product.description;

    product.status = "pending"; // re-submit

    await product.save();
    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔥 DELETE PRODUCT (Cancel)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Not found" });

    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not yours" });
    }

    // 🔥 ONLY pending can be deleted
    if (product.status !== "pending") {
      return res.status(400).json({ message: "Only pending products can be deleted" });
    }

    await product.deleteOne();
    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔥 MARK AS SOLD
router.put("/:id/sold", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Not found" });

    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not yours" });
    }

    // 🔥 ONLY approved can be sold
    if (product.status !== "approved") {
      return res.status(400).json({ message: "Only approved products can be marked as sold" });
    }

    product.status = "sold";

    await product.save();
    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔥 ADMIN: GET ALL PRODUCTS
router.get("/admin/all", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const products = await Product.find().populate("user", "name email");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔥 ADMIN: UPDATE STATUS (approve / reject)
router.put("/:id/status", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Not found" });

    product.status = status;

    await product.save();
    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;