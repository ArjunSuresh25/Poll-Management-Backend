if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const app = express();
const wsServer = require("express-ws")(app);

module.exports = wsServer;

const port = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:3000",
  "https://polls2.vercel.app",
  "https://poll-management-frontend-adarshme.vercel.app",
  "https://polls.adarshmenon.dev",
];

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}: ${req.url}`);
  next();
});
app.use(cors());
app.disable("x-powered-by");

const authRouter = require("./src/routers/auth");
app.use("/", authRouter);

const pollsRouter = require("./src/routers/polls");
app.use("/polls", pollsRouter);

const votesRouter = require("./src/routers/votes");
app.use("/votes", votesRouter);

const adminRouter = require("./src/routers/admin");
app.use("/admin", adminRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
