const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    console.log("AUTH ERROR: No token provided");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    console.log("Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified. User ID:", decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("AUTH ERROR: Token verification failed", error.message);
    res.status(401).json({ message: "Token failed" });
  }
};

module.exports = protect;