const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  platformFee: Number, // 5%
  paymentStatus: { type: String, enum: ['Pending', 'Verified'], default: 'Pending' },
  paymentProof: String // Cloudinary URL
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);