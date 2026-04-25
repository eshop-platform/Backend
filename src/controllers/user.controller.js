const User = require("../models/user.model");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "banned" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("wishlist")
      .populate("cart.item");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();

    const populated = await User.findById(user._id)
      .populate("wishlist")
      .populate("cart.item");

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");
    res.status(200).json({ success: true, data: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/wishlist/:productId
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const productId = req.params.productId;

    const index = user.wishlist.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    const populated = await User.findById(req.user.id).populate("wishlist");
    res.status(200).json({ success: true, data: populated.wishlist });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/cart
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.item");
    res.status(200).json({ success: true, data: user.cart });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/cart/add
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, selectedColor = null, selectedSize = null } = req.body;
    const user = await User.findById(req.user.id);

    const cartItem = user.cart.find(item => 
      item.item.toString() === productId && 
      item.selectedColor === selectedColor && 
      item.selectedSize === selectedSize
    );

    if (cartItem) {
      cartItem.quantity += Number(quantity);
    } else {
      user.cart.push({ item: productId, quantity: Number(quantity), selectedColor, selectedSize });
    }

    await user.save();
    const populated = await User.findById(req.user.id).populate("cart.item");
    res.status(200).json({ success: true, data: populated.cart });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/cart/remove
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId, selectedColor = null, selectedSize = null } = req.body;
    const user = await User.findById(req.user.id);

    user.cart = user.cart.filter(item => 
      !(item.item.toString() === productId && 
        item.selectedColor === selectedColor && 
        item.selectedSize === selectedSize)
    );

    await user.save();
    const populated = await User.findById(req.user.id).populate("cart.item");
    res.status(200).json({ success: true, data: populated.cart });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/cart/quantity
exports.updateCartQuantity = async (req, res, next) => {
  try {
    const { productId, quantity, selectedColor = null, selectedSize = null } = req.body;
    const user = await User.findById(req.user.id);

    const cartItem = user.cart.find(item => 
      item.item.toString() === productId && 
      item.selectedColor === selectedColor && 
      item.selectedSize === selectedSize
    );

    if (cartItem) {
      cartItem.quantity = Number(quantity);
      if (cartItem.quantity <= 0) {
        user.cart = user.cart.filter(item => 
          !(item.item.toString() === productId && 
            item.selectedColor === selectedColor && 
            item.selectedSize === selectedSize)
        );
      }
    }

    await user.save();
    const populated = await User.findById(req.user.id).populate("cart.item");
    res.status(200).json({ success: true, data: populated.cart });
  } catch (error) {
    next(error);
  }
};
