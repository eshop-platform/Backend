const User = require("../models/user.model");
const { signToken } = require("../middlewares/auth");
const { sendEmail, canSendRealEmail } = require("../utils/sendEmail");

const validatePassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(value || ""));

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const buildAuthPayload = (user, token) => ({
  success: true,
  token,
  user: { id: user._id, username: user.username, email: user.email, role: user.role },
});

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { username, fullName, email, password } = req.body;
    const normalizedUsername = String(username || fullName || "").trim();

    if (!normalizedUsername || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email and password are required" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "An account with that email already exists" });
    }
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username is already taken" });
    }

    const requiresVerification = canSendRealEmail();
    const otp = requiresVerification ? createOtp() : "";

    const user = await User.create({
      username: normalizedUsername,
      email,
      password,
      isVerified: !requiresVerification,
      otp: otp || undefined,
      otpExpires: otp ? new Date(Date.now() + 10 * 60 * 1000) : null,
    });

    if (requiresVerification) {
      await sendEmail(user.email, "Verify your PrimeCommerce account", `Your verification code is: ${otp}`);
      return res.status(201).json({
        success: true,
        requiresVerification: true,
        message: "Account created. Check your email for the verification code.",
      });
    }

    const token = signToken(user._id);
    return res.status(201).json({
      ...buildAuthPayload(user, token),
      requiresVerification: false,
      message: "Account created successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and verification code are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpires");
    if (!user || !user.otp || !user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    if (String(user.otp) !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.otp = "";
    user.otpExpires = null;
    await user.save();

    const token = signToken(user._id);
    res.status(200).json({
      ...buildAuthPayload(user, token),
      message: "Email verified successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // We need the password field (it's select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.status === "banned") {
      return res.status(403).json({ success: false, message: "Your account has been banned" });
    }
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Verify your email before signing in" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken(user._id);

    res.status(200).json(buildAuthPayload(user, token));
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = createOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailResult = await sendEmail(user.email, "PrimeCommerce password reset", `Your password reset code is: ${otp}`);

    res.status(200).json({
      success: true,
      message: emailResult.fallback ? "Reset code generated. Email delivery is not configured on this server." : "Reset code sent to your email.",
      devOtp: emailResult.fallback ? otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, code, and new password are required" });
    }
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpires +password");
    if (!user || !user.otp || !user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset code" });
    }
    if (String(user.otp) !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }

    user.password = newPassword;
    user.otp = "";
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me  — returns current user from token
exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};
