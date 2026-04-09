const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authcontroller');
const { protect, adminOnly } = require('../middleware/authmiddleware');

// Public Routes
router.post('/register', register);
router.post('/login', login);

// Example of a Protected Route (Admin Only)
router.get('/admin-data', protect, adminOnly, (req, res) => {
    res.json({ message: "Welcome Admin, this is sensitive data." });
});

module.exports = router;