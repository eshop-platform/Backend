const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🆕 Security Addition: Check if the user is still in DB and not blocked
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked. Contact Admin." });
    }

    req.user = user; // Attach the full user object instead of just the decoded token
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

exports.adminOnly = (req, res, next) => {
  // Check the role on the user object attached in the protect middleware
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};