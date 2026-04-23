require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/user.model");
const Category = require("./src/models/category.model");
const Product = require("./src/models/product.model");
const Purchase = require("./src/models/purchase.model");

const connectDB = require("./src/config/db");

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB. Clearing old data...");
    
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Purchase.deleteMany({});

    console.log("Seeding new data...");

    // 1. Create Users
    const users = await User.insertMany([
      { username: "admin", email: "admin@eshop.local", password: "password123", role: "admin", status: "active" },
      { username: "seller1", email: "seller1@eshop.local", password: "password123", role: "seller", status: "active" },
      { username: "seller2", email: "seller2@eshop.local", password: "password123", role: "seller", status: "banned" },
      { username: "buyer1", email: "buyer1@eshop.local", password: "password123", role: "user", status: "active" },
      { username: "buyer2", email: "buyer2@eshop.local", password: "password123", role: "user", status: "active" }
    ]);

    const seller1 = users[1]._id;
    const seller2 = users[2]._id;
    const buyer1 = users[3]._id;

    // 2. Create Categories
    const categories = await Category.insertMany([
      { name: "Womenswear", description: "Clothing for women" },
      { name: "Menswear", description: "Clothing for men" },
      { name: "Accessories", description: "Bags, jewelry, and more" },
      { name: "Footwear", description: "Shoes and sneakers" }
    ]);

    const catWomenswear = categories[0]._id;
    const catMenswear = categories[1]._id;
    const catAccessories = categories[2]._id;

    // 3. Create Products
    const products = await Product.insertMany([
      { name: "Summer Dress", description: "A nice summer dress", price: 45.99, stock: 15, category: catWomenswear, seller: seller1, status: "approved" },
      { name: "Leather Jacket", description: "Vintage leather jacket", price: 120.00, stock: 5, category: catMenswear, seller: seller1, status: "approved" },
      { name: "Gold Necklace", description: "14k gold necklace", price: 85.50, stock: 0, category: catAccessories, seller: seller2, status: "approved" },
      { name: "Running Sneakers", description: "Comfortable running shoes", price: 65.00, stock: 20, category: categories[3]._id, seller: seller1, status: "pending" },
      { name: "Designer Handbag", description: "Luxury handbag", price: 450.00, stock: 2, category: catAccessories, seller: seller2, status: "rejected" }
    ]);

    // 4. Create Purchases
    await Purchase.insertMany([
      {
        buyer: buyer1,
        products: [
          { product: products[0]._id, quantity: 1, price: 45.99 },
          { product: products[1]._id, quantity: 1, price: 120.00 }
        ],
        totalAmount: 165.99,
        commission: 8.30,
        status: "pending"
      },
      {
        buyer: buyer1,
        products: [
          { product: products[2]._id, quantity: 1, price: 85.50 }
        ],
        totalAmount: 85.50,
        commission: 4.27,
        status: "completed"
      }
    ]);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
