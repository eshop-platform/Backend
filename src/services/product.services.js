const Product = require("../models/product.model");

exports.getAllProducts = async () => {
  return await Product.find();
};

exports.createProduct = async (data) => {
  const product = new Product(data);
  return await product.save();
};