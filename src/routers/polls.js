const express = require("express");
const { nanoid } = require("nanoid");
const apicache = require("apicache");
const pool = require("../../postgres/postgres");
const router = express.Router();

const authenticateToken = require("../middleware/auth").authenticateToken;
const cache = apicache.middleware;

/*
CREATE TABLE "Polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[] NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Polls_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Polls_username_fkey" FOREIGN KEY ("username") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE
);
*/

router.post("/create", authenticateToken, (req, res) => {
  const body = req.body;
  const user = req.user;
  if ((!body.question, !body.options, !body.start_time, !body.end_time)) {
    res.sendStatus(400);
  } else {
    pool.query(
      'SELECT * FROM "Users" WHERE username = $1',
      [user.username],
      (error, results) => {
        if (error) {
          console.error(error);
          res.sendStatus(400);
        } else {
          const result = results.rows[0];
          if (!result.verified) {
            res.status(400).send("User not verified");
          } else {
            const id = nanoid(7).toLowerCase();
            const start_time = new Date(body.start_time);
            const end_time = new Date(body.end_time);
            pool
              .query('INSERT INTO "Polls" VALUES ($1, $2, $3, $4, $5, $6)', [
                id,
                body.question,
                body.options,
                start_time,
                end_time,
                user.username,
              ])
              .then(() => {
                pool
                  .query('INSERT INTO "Poll_Votes" VALUES ($1, $2)', [
                    id,
                    new Array(body.options.length).fill(0),
                  ])
                  .then(() => {
                    res.json({
                      id,
                      question: body.question,
                      options: body.options,
                      startTime: start_time,
                      endTime: end_time,
                      username: user.username,
                    });
                  })
                  .catch((error) => {
                    console.error(error.message);
                    res.sendStatus(400);
                  });
              })
              .catch((err) => {
                console.error(err.message);
                res.sendStatus(400);
              });
          }
        }
      }
    );
  }
});

router
  .route("/:id")
  .get(cache(5000), (req, res) => {
    const id = req.params.id;
    pool.query(
      'SELECT * FROM "Polls" WHERE id = $1',
      [id],
      (error, results) => {
        if (error) {
          console.error(error.message);
          res.sendStatus(400);
        } else if (results.rows.length === 0) {
          res.sendStatus(404);
        } else {
          const result = results.rows[0];
          delete result["username"];
          res.json(result);
        }
      }
    );
  })
  .delete(authenticateToken, (req, res) => {
    const id = req.params.id;
    const user = req.user;
    pool.query(
      'SELECT * FROM "Polls" WHERE id = $1',
      [id],
      (error, results) => {
        if (error) {
          console.error(error.message);
          res.sendStatus(400);
        } else if (results.rows.length === 0) {
          res.sendStatus(404);
        } else {
          const result = results.rows[0];
          if (result.username === user.username) {
            pool.query('DELETE FROM "Polls" WHERE id = $1', [id], (error) => {
              if (error) {
                console.error(error.message);
                res.sendStatus(400);
              } else {
                res.sendStatus(200);
              }
            });
          }
        }
      }
    );
  });

router.get("/", authenticateToken, (req, res) => {
  const user = req.user;
  pool.query(
    'SELECT * FROM "Polls" WHERE username = $1',
    [user.username],
    (error, result) => {
      if (error) {
        console.error(error.message);
        res.sendStatus(400);
      } else {
        res.json(
          result.rows.map((row) => {
            delete row["username"];
            return row;
          })
        );
      }
    }
  );
});

module.exports = router;
