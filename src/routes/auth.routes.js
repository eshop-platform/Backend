const express = require("express");
const { register, verifyEmail, login, forgotPassword, resetPassword, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

module.exports = router;
