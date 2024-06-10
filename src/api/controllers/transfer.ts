import { Request, Response } from "express";
import SuccessHandler from "../../helpers/successHandler";
import ErrorHandler from "../../helpers/errHandler";
import { processTransfers } from "../../sync";

export const getTransfers = async (req: Request, res: Response) => {
  try {
    const { startTimestamp, endTimestamp } = req.query;

    if (!startTimestamp || !endTimestamp) {
      return ErrorHandler.serverResponse(
        res,
        "Missing required query parameters: startTimestamp and endTimestamp",
        200,
      );
    }

    const data = await processTransfers(
      startTimestamp as string,
      endTimestamp as string,
    );
    return SuccessHandler.successWithData(res, 200, data);
  } catch (error) {
    return ErrorHandler.serverResponse(res, "An error occured", 500);
  }
};
