const jwt = require('jsonwebtoken');

// Middleware to protect routes (ensure user is logged in)
exports.protect = (req, res, next) => {
    let token = req.header('Authorization');

    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Adds {id, role} to req object
            next();
        } catch (error) {
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "No token, authorization denied" });
    }
};

// Middleware to restrict access to Admins only
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};