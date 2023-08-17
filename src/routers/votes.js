const express = require("express");
const apicache = require("apicache");
const pool = require("../../postgres/postgres");
const wsServer = require("../../app");
const router = express.Router();

const cache = apicache.middleware;

/*
CREATE TABLE "Poll_Votes" (
    "id" TEXT NOT NULL,
    "votes" INTEGER[] NOT NULL,

    CONSTRAINT "Poll_Votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Polls_Votes_id_fkey" FOREIGN KEY ("id") REFERENCES "Polls"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
*/

router.post("/:id/:option", (req, res) => {
  const id = req.params.id;
  const option = Number.parseInt(req.params.option);
  pool.query('SELECT * FROM "Polls" WHERE id = $1', [id], (error, results) => {
    if (error) {
      console.error(error.message);
      res.sendStatus(400);
    } else if (results.rows.length === 0) {
      res.sendStatus(404);
    } else if (results.rows[0].options.length <= option) {
      res.sendStatus(400);
    } else {
      const result = results.rows[0];
      const currentTime = new Date();
      if (result.startTime > currentTime) {
        res.status(400).send("Voting will begin at " + result.startTime);
      } else if (result.endTime < currentTime) {
        res.status(400).send("Voting ended at " + result.endTime);
      } else {
        pool.query(
          'UPDATE "Poll_Votes" SET votes[$1] = votes[$1] + 1 WHERE id = $2 RETURNING votes',
          [option + 1, id],
          (error, result) => {
            if (error) {
              console.error(error.message);
              res.sendStatus(400);
            } else {
              res.sendStatus(200);
              const votes = JSON.stringify(result.rows[0].votes);
              wsServer.getWss().clients.forEach((client) => {
                if (client.readyState === 1 && client.pollId === id) {
                  //WebSocket.OPEN
                  client.send(votes);
                }
              });
            }
          }
        );
      }
    }
  });
});

// router.get("/:id", cache(1000), (req, res) => {
//   const id = req.params.id;
//   pool.query(
//     'SELECT * FROM "Poll_Votes" WHERE id = $1',
//     [id],
//     (error, result) => {
//       if (error) {
//         console.error(error.message);
//         res.sendStatus(400);
//       } else if (result.rows.length === 0) {
//         res.sendStatus(404);
//       } else {
//         res.json(result.rows[0].votes.filter((val) => val != null));
//       }
//     }
//   );
// });

router.ws("/:id", (ws, req) => {
  const id = req.params.id;
  ws.pollId = id;
  pool.query(
    'SELECT * FROM "Poll_Votes" WHERE id = $1',
    [id],
    (error, result) => {
      if (error) {
        ws.close();
      } else if (result.rows.length === 0) {
        ws.close();
      } else {
        ws.send(JSON.stringify(result.rows[0].votes));
        ws.on("message", (msg) => {
          if (msg === "ping") ws.send("pong");
        });
      }
    }
  );
});

module.exports = router;
