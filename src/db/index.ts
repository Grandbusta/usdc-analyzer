import knex from "knex";
import type { Knex } from "knex";

import dotenv from "dotenv";
import path from "path";
import logger from "../logger";
dotenv.config({ path: path.join(__dirname, "../../.env") });

const config: Knex.Config = {
  client: "postgresql",
  connection: {
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};

export const db = knex(config);

export const testDbConnection = async () => {
  try {
    await db.raw("SELECT 1");
    logger.info("Databse Connected succesfully");
  } catch (error) {
    console.log("PostgreSQL not connected");
    logger.error("Error while connecting to Database");
  }
};

export default config;
