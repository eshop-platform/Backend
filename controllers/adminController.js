const User = require('../models/User');
const Order = require('../models/Order');

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

exports.toggleUserBlock = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ message: `User ${user.isBlocked ? 'Blocked' : 'Unblocked'}` });
};

// 10. Calculate Income per day (from 5%)
exports.getDailyIncome = async (req, res) => {
  const start = new Date(); start.setHours(0,0,0,0);
  const stats = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, paymentStatus: 'Verified' } },
    { $group: { _id: null, total: { $sum: "$platformFee" } } }
  ]);
  res.json({ dailyIncome: stats[0]?.total || 0 });
};

exports.verifyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: "Order not found" });

  order.paymentStatus = 'Verified';
  await order.save();

  res.json({ message: "Payment verified", order });
};

exports.updateDelivery = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: "Order not found" });

  order.deliveryStatus = status;

  await order.save();

  res.json({ message: "Delivery updated", order });
};
