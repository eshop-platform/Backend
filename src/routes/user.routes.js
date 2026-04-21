const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

// Profile (already working)
router.get("/profile", authMiddleware, userController.getProfile);

//  Admin-only route
router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin " });
  }
);

module.exports = router;