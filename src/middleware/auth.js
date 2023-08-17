const jwt = require("jsonwebtoken");

const jwt_secret = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwt_secret, (err, user) => {
    if (err) {
      console.error(err.message);
      return res.sendStatus(401);
    }

    req.user = user;

    next();
  });
}

function checkAdminUser(req, res, next) {
  const user = req.user;

  if (user.username !== "admin" && user.role !== "ADMIN") {
    return res.status(403).send("User not admin");
  }

  next();
}

module.exports = {
  authenticateToken,
  checkAdminUser,
};
