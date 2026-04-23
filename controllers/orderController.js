const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body; // Items sent from LocalStorage

    let totalAmount = 0;
    // Calculate total and platform fee (5%)
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

    const platformFee = totalAmount * 0.05;

    const order = new Order({
      buyer: req.user.id,
      items,
      totalAmount,
      platformFee,
      paymentStatus: 'Pending'
    });

    await order.save();
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error creating order" });
  }
};


exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ buyer: req.user.id })
    .populate('items.product');

  res.json(orders);
};