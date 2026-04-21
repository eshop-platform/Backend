const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    description: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "sold", "archived"],
      default: "pending"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);