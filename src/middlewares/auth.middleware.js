const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.log("HEADERS ", req.headers); 

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No header" });
    }

    const token = authHeader.split(" ")[1];

    console.log("TOKEN ", token); 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED ", decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.log("ERROR ", err.message); 
    return res.status(401).json({ message: "Invalid token" });
  }
};