import { db } from "..";
import { Transfer } from "../../models/transfers";

export const insertTransfers = async (transfers: Transfer[]) => {
  await db("transfers")
    .insert(transfers)
    .onConflict("transaction_hash")
    .ignore();
};

export const getLatestTransferBlock = async (): Promise<
  { block_number: number } | undefined
> => {
  const data = await db("transfers")
    .select("block_number")
    .orderBy("block_number", "desc")
    .first();
  return data;
};

export const getTransfersWithTimestampRange = async (
  startTimestamp: string,
  endTimestamp: string,
) => {
  const data = await db("transfers")
    .select("*")
    .where("transaction_timestamp", ">=", startTimestamp)
    .andWhere("transaction_timestamp", "<=", endTimestamp)
    .orderBy("transaction_timestamp", "desc");
  return data;
};

export const getMinAndMaxBlocks = async (
  startBlock: number,
  endBlock: number,
) => {
  const data = await db("transfers")
    .min("block_number as min_block")
    .max("block_number as max_block")
    .where("block_number", ">=", startBlock)
    .andWhere("block_number", "<=", endBlock)
    .first();
  return data;
};
