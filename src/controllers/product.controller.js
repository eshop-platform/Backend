const Product = require("../models/product.model");
const Category = require("../models/category.model");

// GET /api/products  — supports ?q=, ?cat=, ?sort=, ?status=
exports.getAllProducts = async (req, res, next) => {
  try {
    const { q, cat, sort, status, gender } = req.query;

    // Build the mongo filter
    const filter = {};

    // Status filter (admin use: pending / approved / rejected)
    if (status) filter.status = status;

    // Collection flags
    if (cat === "new")          filter.isNew = true;
    else if (cat === "sale")    filter.onSale = true;
    else if (cat === "best-sellers") filter.bestSeller = true;
    else if (cat === "men")     filter.gender = "men";
    else if (cat === "women")   filter.gender = "women";
    else if (cat && cat !== "All") {
      // Try matching by category name
      const categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${cat}$`, "i") } });
      if (categoryDoc) filter.category = categoryDoc._id;
    }

    // Gender filter (explicit)
    if (gender) filter.gender = gender;

    // Full-text-style search across name, description, tags
    if (q) {
      filter.$or = [
        { name:        { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags:        { $regex: q, $options: "i" } },
      ];
    }

    // Build sort
    let sortObj = { createdAt: -1 };
    if (sort === "price-low")  sortObj = { price: 1 };
    else if (sort === "price-high") sortObj = { price: -1 };
    else if (sort === "rating")     sortObj = { rating: -1, reviewCount: -1 };
    else if (sort === "newest")     sortObj = { isNew: -1, createdAt: -1 };

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("seller", "username email")
      .sort(sortObj);

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("seller", "username email");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products  — create a new product
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, seller: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id  — update a product
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/approve
exports.approveProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/reject
exports.rejectProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/stock
exports.updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

