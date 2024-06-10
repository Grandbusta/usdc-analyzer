import { Response } from "express";

const ErrorHandler = {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  validationError: (res: Response, error: any) =>
    res.status(400).json({
      status: "error",
      message: error.details[0].message,
    }),
  serverResponse: (res: Response, message: string, status: number) =>
    res.status(status).json({
      status: "error",
      message,
    }),
};

export default ErrorHandler;
