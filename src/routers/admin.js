const express = require("express");
const pool = require("../../postgres/postgres");
const { authenticateToken, checkAdminUser } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken, checkAdminUser);

router.post("/verify-user", (req, res) => {
  const body = req.body;
  if (!body.username || typeof body.verified !== "boolean") {
    res.sendStatus(400);
  } else {
    pool.query(
      'UPDATE "Users" SET verified = $1 WHERE username = $2',
      [body.verified, body.username],
      (error, result) => {
        if (error) {
          console.error(error.message);
          res.sendStatus(400);
        } else if (result.rowCount === 0) {
          res.sendStatus(404);
        } else {
          res.sendStatus(200);
        }
      }
    );
  }
});

router.get("/users", (req, res) => {
  pool.query('SELECT * FROM "Users"', (error, result) => {
    if (error) {
      console.error(error);
      res.sendStatus(400);
    } else {
      res.json(
        result.rows.map((row) => {
          delete row["passwordHash"];
          return row;
        })
      );
    }
  });
});

router.get("/polls", (req, res) => {
  pool.query('SELECT * FROM "Polls"', (error, result) => {
    if (error) {
      console.error(error);
      res.sendStatus(400);
    } else {
      res.json(result.rows);
    }
  });
});

router.get("/poll-votes", (req, res) => {
  pool.query('SELECT * FROM "Poll_Votes"', (error, result) => {
    if (error) {
      console.error(error);
      res.sendStatus(400);
    } else {
      res.json(result.rows);
    }
  });
});

router.delete("/user/:username", (req, res) => {
  const username = req.params.username;
  pool.query(
    'DELETE FROM "Polls" WHERE username = $1',
    [username],
    (error, result) => {
      if (error) {
        console.error(error.message);
        res.sendStatus(400);
      } else {
        pool.query(
          'DELETE FROM "Users" WHERE username = $1',
          [username],
          (error, result) => {
            if (error) {
              console.error(error.message);
              res.sendStatus(400);
            } else if (result.rowCount === 0) {
              res.sendStatus(404);
            } else {
              res.sendStatus(200);
            }
          }
        );
      }
    }
  );
});

module.exports = router;
