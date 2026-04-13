const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Helper to validate password strength
const validatePassword = (pass) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);
};

// --- REGISTER ---
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, adminSecret } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: "Password must include uppercase, lowercase, number, and special character" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Admin Security Check
    if (role === 'admin' && adminSecret !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({ message: "Invalid admin secret code" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    // Save User
    await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'user',
      otp: hashedOtp, 
      otpExpires: Date.now() + 600000 // 10 minutes
    });

    // Send Email
    await sendEmail(email, "Verify Your Email", `Your verification code is: ${rawOtp}`);

    res.status(201).json({ message: "Registration successful. Check email for OTP." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// --- VERIFY EMAIL ---
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
        email, 
        otpExpires: { $gt: Date.now() } 
    });

    if (!user || !user.otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Verify email first" });
    }

    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
    );

    // Matches AuthContext.jsx: setUser({ name: userData.name, role: userData.role })
    res.json({ 
      token, 
      role: user.role, 
      name: user.fullName 
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

// --- FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 600000;
    await user.save();

    await sendEmail(email, "Reset Password OTP", `Your code: ${rawOtp}`);
    res.json({ message: "Reset OTP sent" });
  } catch (error) {
    res.status(500).json({ message: "Error sending email" });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "Weak password" });
    }

    const user = await User.findOne({ 
        email, 
        otpExpires: { $gt: Date.now() } 
    });

    if (!user || !user.otp) {
      return res.status(400).json({ message: "Invalid/Expired code" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid code" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Reset failed" });
  }
};