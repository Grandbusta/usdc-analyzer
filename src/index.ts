import dotenv from "dotenv";
dotenv.config();
import express from "express";
import router from "./api/routes";
import { testDbConnection } from "./db";
import logger from "./logger";
const app = express();
const port = process.env.PORT || 4000;

app.use("/", router);

app.listen(port, async () => {
  await testDbConnection();
  logger.info("Server started", { port: port });
});
