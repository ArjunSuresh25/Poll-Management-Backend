const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const pool = require("../../postgres/postgres");

const jwt_secret = process.env.JWT_SECRET;

/*
CREATE TABLE "Users" (
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("username")
);
*/

router.post("/signup", (req, res) => {
  const body = req.body;
  if (!body?.username || !body?.password || !body?.name) {
    res.sendStatus(400);
  } else {
    const passwordHash = sha512(body.password);
    pool
      .query('INSERT INTO "Users" VALUES ($1, $2, $3)', [
        body.username,
        passwordHash,
        body.name,
      ])
      .then(() => {
        res.sendStatus(200);
      })
      .catch((err) => {
        console.error(err.message);
        res.sendStatus(409);
      });
  }
});

router.post("/signin", (req, res) => {
  const body = req.body;
  if (!body?.username || !body?.password) {
    res.sendStatus(401);
  } else {
    pool.query(
      `SELECT * FROM "Users" WHERE username=$1`,
      [body.username],
      (error, results) => {
        if (error || results.rows.length === 0) {
          res.sendStatus(401);
        } else {
          const result = results.rows[0];
          const passwordHash = sha512(body.password);
          if (result.passwordHash === passwordHash) {
            res.json({
              access_token: generateAccessToken({
                username: body.username,
              }),
            });
          } else {
            res.sendStatus(401);
          }
        }
      }
    );
  }
});

function generateAccessToken(payload) {
  return jwt.sign(payload, jwt_secret, { expiresIn: "1800s" });
}

function sha512(value) {
  return crypto.createHash("sha512").update(value).digest("hex");
}

module.exports = router;
