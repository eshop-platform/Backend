require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./src/config/db");

const User     = require("./src/models/user.model");
const Category = require("./src/models/category.model");
const Product  = require("./src/models/product.model");
const Purchase = require("./src/models/purchase.model");

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB. Clearing old data...");

    await Purchase.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    console.log("Seeding users...");

    // Passwords are plain-text here; the pre-save hook will hash them
    const users = await User.insertMany([
      { username: "admin",   email: "admin@eshop.local",   password: "password123", role: "admin",  status: "active" },
      { username: "seller1", email: "seller1@eshop.local", password: "password123", role: "seller", status: "active" },
      { username: "seller2", email: "seller2@eshop.local", password: "password123", role: "seller", status: "banned" },
      { username: "buyer1",  email: "buyer1@eshop.local",  password: "password123", role: "user",   status: "active" },
      { username: "buyer2",  email: "buyer2@eshop.local",  password: "password123", role: "user",   status: "active" },
    ]);

    // NOTE: insertMany bypasses the pre-save hook, so hash manually
    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash("password123", salt);
      await user.save({ validateBeforeSave: false });
    }

    const [adminUser, seller1, seller2, buyer1] = users;

    console.log("Seeding categories...");
    const categories = await Category.insertMany([
      { name: "Womenswear", description: "Clothing for women" },
      { name: "Menswear",   description: "Clothing for men" },
      { name: "Accessories",description: "Bags, jewelry, and more" },
      { name: "Footwear",   description: "Shoes and sneakers" },
      { name: "Apparel",    description: "General apparel" },
      { name: "Audio",      description: "Headphones, speakers" },
      { name: "Tech",       description: "Technology gadgets" },
      { name: "Home",       description: "Home and lifestyle" },
      { name: "Gear",       description: "Bags and outdoor gear" },
    ]);

    const catMap = Object.fromEntries(categories.map(c => [c.name, c._id]));

    console.log("Seeding products...");
    const products = await Product.insertMany([
      {
        name: "Cloud Comfort Runner",
        description: "A lightweight daily runner with a breathable mesh upper.",
        price: 1850, stock: 18, category: catMap["Footwear"], seller: seller1._id,
        status: "approved", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"],
        colors: ["Phantom Black", "Ghost White", "Midnight Blue"], sizes: ["7","8","9","10","11"],
        isNewCollection: true, bestSeller: true, rating: 4.8, reviewCount: 126, tags: ["running","sneakers","comfort"],
      },
      {
        name: "Minimalist Leather Watch",
        description: "A slim premium leather watch with a brushed steel case.",
        price: 2800, stock: 11, category: catMap["Accessories"], seller: seller1._id,
        status: "approved", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"],
        colors: ["Tan", "Black", "Espresso"], sizes: ["40mm", "42mm"],
        isNewCollection: true, rating: 4.7, reviewCount: 84, tags: ["watch","leather","minimal"],
      },
      {
        name: "Urban Tech Backpack",
        description: "A structured commuter backpack with padded laptop storage.",
        price: 1450, stock: 24, category: catMap["Gear"], seller: seller1._id,
        status: "approved", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80"],
        colors: ["Slate", "Forest", "Black"], sizes: ["20L", "28L"],
        isNewCollection: true, bestSeller: true, rating: 4.9, reviewCount: 211, tags: ["backpack","travel","laptop"],
      },
      {
        name: "Studio ANC Headphones",
        description: "Over-ear wireless headphones with adaptive noise cancelling.",
        price: 4500, stock: 9, category: catMap["Audio"], seller: seller2._id,
        status: "approved", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"],
        colors: ["Matte Black", "Silver Mist", "Sand"], sizes: ["Standard"],
        onSale: true, bestSeller: true, rating: 4.8, reviewCount: 173, tags: ["headphones","wireless","noise cancelling"],
      },
      {
        name: "Meridian Wool Coat",
        description: "A tailored wool blend coat for cold-weather versatility.",
        price: 3600, stock: 7, category: catMap["Apparel"], seller: seller1._id,
        status: "approved", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"],
        colors: ["Camel", "Charcoal", "Navy"], sizes: ["S","M","L","XL"],
        rating: 4.6, reviewCount: 52, tags: ["coat","outerwear","wool"],
      },
      {
        name: "Aero Shell Jacket",
        description: "A water-resistant technical shell with lightweight insulation.",
        price: 2400, stock: 13, category: catMap["Apparel"], seller: seller1._id,
        status: "approved", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"],
        colors: ["Ice Gray", "Graphite", "Olive"], sizes: ["S","M","L","XL"],
        isNewCollection: true, rating: 4.5, reviewCount: 66, tags: ["jacket","shell","technical"],
      },
      {
        name: "Drift Everyday Tee",
        description: "A premium cotton jersey tee with a structured fit.",
        price: 640, stock: 25, category: catMap["Apparel"], seller: seller1._id,
        status: "approved", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"],
        colors: ["White", "Black", "Clay"], sizes: ["S","M","L","XL"],
        isNewCollection: true, bestSeller: true, rating: 4.7, reviewCount: 164, tags: ["tshirt","cotton","basics"],
      },
      {
        name: "Parallel Cargo Pant",
        description: "Modern tapered cargo pants with stretch twill and utility pockets.",
        price: 1680, stock: 14, category: catMap["Apparel"], seller: seller2._id,
        status: "approved", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80"],
        colors: ["Khaki", "Black", "Olive"], sizes: ["30","32","34","36"],
        onSale: true, rating: 4.6, reviewCount: 77, tags: ["pants","cargo","utility"],
      },
      {
        name: "Northline Beanie",
        description: "A soft rib-knit beanie with enough stretch for everyday wear.",
        price: 520, stock: 32, category: catMap["Accessories"], seller: seller1._id,
        status: "approved", image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80"],
        colors: ["Heather Gray", "Black", "Rust"], sizes: ["One Size"],
        onSale: true, bestSeller: true, rating: 4.8, reviewCount: 118, tags: ["beanie","winter","accessories"],
      },
      {
        name: "Atlas Weekend Duffel",
        description: "A structured duffel with shoe compartment for short trips.",
        price: 2300, stock: 8, category: catMap["Gear"], seller: seller2._id,
        status: "approved", image: "https://images.unsplash.com/photo-1553531889-56cc480ac5cb?auto=format&fit=crop&w=900&q=80",
        images: ["https://images.unsplash.com/photo-1553531889-56cc480ac5cb?auto=format&fit=crop&w=900&q=80"],
        colors: ["Espresso", "Black", "Stone"], sizes: ["32L"],
        bestSeller: true, rating: 4.8, reviewCount: 91, tags: ["duffel","travel","weekend"],
      },
      {
        name: "Running Sneakers — Pending",
        description: "Comfortable running shoes awaiting approval.",
        price: 1200, stock: 20, category: catMap["Footwear"], seller: seller1._id,
        status: "pending", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        images: [], colors: ["White", "Blue"], sizes: ["7","8","9","10"],
        tags: ["running","footwear"],
      },
    ]);

    console.log("Seeding purchases...");
    await Purchase.insertMany([
      {
        buyer: buyer1._id,
        products: [
          { product: products[0]._id, quantity: 1, price: products[0].price },
          { product: products[2]._id, quantity: 1, price: products[2].price },
        ],
        totalAmount: products[0].price + products[2].price,
        commission: parseFloat(((products[0].price + products[2].price) * 0.05).toFixed(2)),
        status: "completed",
        txRef: "SEED-TX-001",
      },
      {
        buyer: buyer1._id,
        products: [
          { product: products[3]._id, quantity: 1, price: products[3].price },
        ],
        totalAmount: products[3].price,
        commission: parseFloat((products[3].price * 0.05).toFixed(2)),
        status: "pending",
        txRef: "SEED-TX-002",
      },
    ]);

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
