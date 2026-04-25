const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewerKey: { type: String, default: "" },
  author: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: "" },
  body: { type: String, default: "" },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  sellerSnapshot: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    brandName: { type: String, default: "" },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  // Primary image (URL)
  image: {
    type: String,
    default: "",
  },
  // Gallery images
  images: [{ type: String }],
  // Variants
  colors: [{ type: String }],
  sizes: [{ type: String }],
  // Collection flags
  isNewCollection: { type: Boolean, default: false },
  onSale:      { type: Boolean, default: false },
  bestSeller:  { type: Boolean, default: false },
  gender:      { type: String, enum: ["men", "women", "unisex", ""], default: "" },
  // Stats
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  tags:        [{ type: String }],
<<<<<<< HEAD
  likes:       { type: Number, default: 0 },
=======
  aiSummary:   { type: String, default: "" },
>>>>>>> eaa190191e9c5acb24a33802d88adb6be4c8fcff
  // Embedded reviews
  reviews:     [reviewSchema],
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);

