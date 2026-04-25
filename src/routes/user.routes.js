const express = require("express");
const { 
  getAllUsers, 
  banUser, 
  unbanUser, 
  deleteUser,
  getProfile,
  updateProfile,
  getWishlist,
  toggleWishlist,
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity
} = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middlewares/auth");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

router.get("/cart", protect, getCart);
router.post("/cart/add", protect, addToCart);
router.post("/cart/remove", protect, removeFromCart);
router.patch("/cart/quantity", protect, updateCartQuantity);

router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/:productId", protect, toggleWishlist);

router.get("/", protect, adminOnly, getAllUsers);
router.patch("/:id/ban", protect, adminOnly, banUser);
router.patch("/:id/unban", protect, adminOnly, unbanUser);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;