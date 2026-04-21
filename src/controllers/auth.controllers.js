const jwt = require("jsonwebtoken");
const authService = require("../services/auth.services");

exports.register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);

    const { password, ...userWithoutPassword } = user._doc;

    res.status(201).json(userWithoutPassword);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await authService.loginUser(req.body);

    const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};