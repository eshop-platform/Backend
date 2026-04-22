const Product = require('../models/Product');

// 1 & 2. Get Products (Publicly viewable - only Approved)
exports.getAllProducts = async (req, res) => {
  const { category, search } = req.query;

  let filter = { status: 'Approved' };

  if (category) filter.category = category;

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const products = await Product.find(filter);

  res.json(products);
};

// 5. Post Product (Admin bypasses approval)
// --- POST PRODUCT (Requirement #5) ---
exports.postProduct = async (req, res) => {
  try {
    // Check if the person logged in is an admin
    const isAdmin = req.user.role === 'admin';

    const images = {
      front: req.files['frontView']?.[0]?.path,
      back: req.files['backView']?.[0]?.path,
      side: req.files['sideView']?.[0]?.path
    };

    const product = new Product({
      ...req.body,
      images,
      seller: req.user.id,
      // LOGIC: If admin, status is Approved. If user, status is Pending.
      status: isAdmin ? 'Approved' : 'Pending' 
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
  console.error("POST PRODUCT ERROR:", error);
  res.status(500).json({ message: error.message });
}
};

// --- ADMIN REVIEW (The code you just shared) ---
exports.reviewProduct = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: `Product has been ${status}`, product });
  } catch (error) {
    res.status(500).json({ message: "Review failed" });
  }
};

// 6. Edit/Cancel Post
exports.updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });

  const isAdmin = req.user.role === 'admin';
  const isOwner = product.seller.toString() === req.user.id;

  if (!isAdmin && !isOwner) return res.status(403).json({ message: "Unauthorized" });
  if (!isAdmin && product.status === 'Approved') return res.status(400).json({ message: "Cannot edit approved product" });

  Object.assign(product, req.body);
  await product.save();
  res.json(product);
};

exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'fullName');

    if (!product || product.status !== 'Approved') {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product" });
  }
};

exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  const isAdmin = req.user.role === 'admin';
  const isOwner = product.seller.toString() === req.user.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await product.deleteOne();
  res.json({ message: "Product deleted" });
};





exports.cancelProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product.seller.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (product.status !== 'Pending') {
    return res.status(400).json({ message: "Only pending products can be canceled" });
  }

  await product.deleteOne();
  res.json({ message: "Product request canceled" });
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};


// 9. Rating
exports.rateProduct = async (req, res) => {
  const { rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const product = await Product.findById(req.params.id);

  const existing = product.ratings.find(
    r => r.user.toString() === req.user.id
  );

  if (existing) {
    existing.rating = rating; // update
  } else {
    product.ratings.push({ user: req.user.id, rating });
  }

  product.avgRating =
    product.ratings.reduce((acc, r) => acc + r.rating, 0) /
    product.ratings.length;

  await product.save();

  res.json({ message: "Rated successfully" });
};



