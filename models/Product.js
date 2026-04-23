const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
 category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  price: { type: Number, required: true },
  description: { type: String },
  stockQuantity: { type: Number, default: 1 },
  images: { front: String, back: String, side: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 }
  }],
  avgRating: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Product', productSchema);