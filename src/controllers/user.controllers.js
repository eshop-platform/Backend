const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    const products = await Product.find({ user: req.user.id });

    const orders = await Order.find({ user: req.user.id });

    const formattedProducts = products.map(p => {
      let statusText = "";

      if (p.status === "pending") statusText = " Waiting Approval";
      if (p.status === "approved") statusText = " Live";
      if (p.status === "rejected") statusText = " Rejected";
      if (p.status === "sold") statusText = " Sold";

      return {
        id: p._id,
        name: p.name,
        price: p.price,
        status: p.status,
        statusText
      };
    });

    res.json({
      user,
      products: formattedProducts,
      orders
    });

  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};