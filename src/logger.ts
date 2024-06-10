import { createLogger, format, transports } from "winston";
import * as path from "path";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${meta ? JSON.stringify(meta) : ""}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(__dirname, "logs", "app.log") }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(__dirname, "logs", "exceptions.log"),
    }),
  ],
});

export default logger;
