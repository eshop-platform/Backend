const Product = require("../models/product.model");
const Category = require("../models/category.model");

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated values
  }

  return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
};

const ensureCategory = async (categoryValue) => {
  if (!categoryValue) {
    return null;
  }

  const normalized = String(categoryValue).trim();
  if (!normalized) {
    return null;
  }

  const byId = normalized.match(/^[a-f\d]{24}$/i)
    ? await Category.findById(normalized)
    : null;

  if (byId) {
    return byId;
  }

  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
  });

  if (existing) {
    return existing;
  }

  return Category.create({ name: normalized });
};

const mapProduct = (product) => {
  const image = product.image || product.images?.[0] || "";
  const categoryName =
    typeof product.category === "object" && product.category?.name
      ? product.category.name
      : product.categoryName || "";

  return {
    id: product._id,
    name: product.name,
    image,
    images: product.images?.length ? product.images : image ? [image] : [],
    category: categoryName,
    price: product.price,
    description: product.description,
    stock: product.stock,
    colors: product.colors ?? [],
    sizes: product.sizes ?? [],
    rating: Number(product.rating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    reviews: (product.reviews ?? []).map((review) => ({
      id: review._id,
      author: review.author,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt,
    })),
    tags: product.tags ?? [],
    status: product.status,
    sellerName: product.sellerSnapshot?.name || product.seller?.username || "",
    sellerEmail: product.sellerSnapshot?.email || product.seller?.email || "",
    brandName: product.sellerSnapshot?.brandName || "",
    submittedAt: product.createdAt,
    aiSummary: product.aiSummary || "",
    isNew: Boolean(product.isNew),
    onSale: Boolean(product.onSale),
    bestSeller: Boolean(product.bestSeller),
    gender: product.gender || "",
  };
};

const recalculateReviewStats = (product) => {
  const total = product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  product.reviewCount = product.reviews.length;
  product.rating = product.reviewCount ? Number((total / product.reviewCount).toFixed(1)) : 0;
};

// GET /api/products  — supports ?q=, ?cat=, ?sort=, ?status=
exports.getAllProducts = async (req, res, next) => {
  try {
    const { q, cat, sort, status, gender, sellerEmail } = req.query;

    // Build the mongo filter
    const filter = {};

    if (sellerEmail) {
      filter["sellerSnapshot.email"] = sellerEmail.toLowerCase().trim();
    }

    if (status) filter.status = status;
    else if (!sellerEmail) filter.status = "approved";

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

    res.status(200).json({ success: true, count: products.length, data: products.map(mapProduct) });
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
    res.status(200).json({ success: true, data: mapProduct(product) });
  } catch (error) {
    next(error);
  }
};

// POST /api/products  — create a new product
exports.createProduct = async (req, res, next) => {
  try {
    const categoryDoc = await ensureCategory(req.body.category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    const image = req.file?.path || req.body.image || "";
    const colors = parseList(req.body.colors);
    const sizes = parseList(req.body.sizes);
    const tags = parseList(req.body.tags);

    const product = await Product.create({
      name: req.body.name,
      description: req.body.description || "",
      price: Number(req.body.price),
      stock: Number(req.body.stock ?? 0),
      category: categoryDoc._id,
      seller: req.user?._id ?? null,
      sellerSnapshot: {
        name: req.body.sellerName || req.user?.username || "",
        email: (req.body.sellerEmail || req.user?.email || "").toLowerCase(),
        brandName: req.body.brandName || "",
      },
      status: req.body.status || "pending",
      image,
      images: image ? [image] : [],
      colors,
      sizes,
      tags,
      aiSummary: req.body.aiSummary || "",
    });

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("seller", "username email");

    res.status(201).json({ success: true, data: mapProduct(populatedProduct) });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/submit — public seller submission
exports.submitProduct = async (req, res, next) => {
  try {
    const { sellerName, sellerEmail, brandName, name, category, price, stock, description, aiSummary } = req.body;

    if (!sellerName || !sellerEmail || !brandName || !name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Seller, brand, product name, category, and price are required.",
      });
    }

    const categoryDoc = await ensureCategory(category);
    const image = req.file?.path || "";

    if (!image) {
      return res.status(400).json({ success: false, message: "A main product image is required." });
    }

    const product = await Product.create({
      name,
      description: description || "",
      price: Number(price),
      stock: Number(stock ?? 0),
      category: categoryDoc._id,
      sellerSnapshot: {
        name: sellerName,
        email: String(sellerEmail).toLowerCase(),
        brandName,
      },
      status: "pending",
      image,
      images: [image],
      colors: parseList(req.body.colors),
      sizes: parseList(req.body.sizes),
      tags: parseList(req.body.tags),
      aiSummary: aiSummary || "",
    });

    const populatedProduct = await Product.findById(product._id).populate("category", "name");
    res.status(201).json({ success: true, data: mapProduct(populatedProduct) });
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
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("seller", "username email");
    res.status(200).json({ success: true, data: mapProduct(populatedProduct) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/approve
exports.approveProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const populatedProduct = await Product.findById(product._id).populate("category", "name").populate("seller", "username email");
    res.status(200).json({ success: true, data: mapProduct(populatedProduct) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/reject
exports.rejectProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const populatedProduct = await Product.findById(product._id).populate("category", "name").populate("seller", "username email");
    res.status(200).json({ success: true, data: mapProduct(populatedProduct) });
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
    const populatedProduct = await Product.findById(product._id).populate("category", "name").populate("seller", "username email");
    res.status(200).json({ success: true, data: mapProduct(populatedProduct) });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/reviews
exports.addReview = async (req, res, next) => {
  try {
    const { author, rating, title = "", body = "", reviewerKey = "" } = req.body;

    if (!author || !rating) {
      return res.status(400).json({ success: false, message: "Author and rating are required." });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const normalizedReviewerKey = String(reviewerKey || "").trim();
    const existingReview = normalizedReviewerKey
      ? product.reviews.find((review) => review.reviewerKey === normalizedReviewerKey)
      : null;

    if (existingReview) {
      existingReview.author = author;
      existingReview.rating = numericRating;
      existingReview.title = title;
      existingReview.body = body;
    } else {
      product.reviews.push({
        reviewerKey: normalizedReviewerKey,
        author,
        rating: numericRating,
        title,
        body,
      });
    }

    recalculateReviewStats(product);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("seller", "username email");

    res.status(200).json({ success: true, data: mapProduct(populatedProduct) });
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

