import { Response } from "express";

const SuccessHandler = {
  successWithMessage(res: Response, statusCode: number, message: string) {
    return res.status(statusCode).json({ message, status: "success" });
  },
  /* eslint-disable @typescript-eslint/no-explicit-any */
  successWithData(res: Response, statusCode: number, data: any) {
    return res.status(statusCode).json({ data, status: "success" });
  },
  /* eslint-disable @typescript-eslint/no-explicit-any */
  successWithMessageAndData(
    res: Response,
    statusCode: number,
    message: string,
    data: any,
  ) {
    return res.status(statusCode).json({
      data,
      message,
      status: "success",
    });
  },
};

export default SuccessHandler;
