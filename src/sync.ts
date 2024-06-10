import { EventLog, Web3 } from "web3";
import EthDater from "ethereum-block-by-date";
const contractAddress = process.env.CONTRACT_ADDRESS;
const rpcUrl = process.env.RPC_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl as string));
import { ERC20abi } from "./abi";
import { Transfer } from "./models/transfers";
import {
  getMinAndMaxBlocks,
  getTransfersWithTimestampRange,
  insertTransfers,
} from "./db/queries/transfers";
import logger from "./logger";

const usdcContract = new web3.eth.Contract(ERC20abi, contractAddress);
const dater = new EthDater(web3 as any);
let eventLimit = 10;

function splitRange(
  start: number,
  end: number,
  chunkSize: number,
): { from: number; to: number }[] {
  const ranges = [];
  for (let i = start; i <= end; i += chunkSize) {
    ranges.push({ from: i, to: Math.min(i + chunkSize - 1, end) });
  }
  return ranges;
}

async function fetchEventsInRange(fromBlock: number, toBlock: number) {
  const events = await usdcContract.getPastEvents("Transfer" as any, {
    fromBlock,
    toBlock,
  });
  return events as EventLog[];
}

async function getBlockNumbersForRange(
  startTimestamp: string,
  endTimestamp: string,
) {
  const { block: startBlock } = await dater.getDate(startTimestamp);
  const { block: endBlock } = await dater.getDate(endTimestamp);
  return { startBlock, endBlock };
}

async function getMissingBlockRanges(startBlock: number, endBlock: number) {
  const missingRanges: { from: number; to: number }[] = [];

  const res = await getMinAndMaxBlocks(startBlock, endBlock);
  if (!res) {
    return missingRanges;
  }
  const { min_block, max_block } = res;
  if (!(min_block & max_block)) {
    missingRanges.push({ from: startBlock, to: endBlock });
    return missingRanges;
  }
  if (min_block > startBlock) {
    missingRanges.push({ from: startBlock, to: min_block - 1 });
  }
  if (max_block < endBlock) {
    missingRanges.push({ from: max_block + 1, to: endBlock });
  }
  return missingRanges;
}

async function getBlockTimestamp(blockNumber: number) {
  const block = await web3.eth.getBlock(blockNumber);
  return block.timestamp;
}

async function formatEvents(events: EventLog[]) {
  const formattedEvents: Transfer[] = [];
  for (const event of events) {
    const eventTimestamp = await getBlockTimestamp(event.blockNumber as number);
    logger.debug(
      `Processing event ${event.transactionHash} at timestamp ${eventTimestamp}`,
    );
    formattedEvents.push({
      transaction_timestamp: new Date(
        Number(eventTimestamp) * 1000,
      ).toISOString(),
      transaction_hash: event.transactionHash as string,
      block_number: event.blockNumber as number,
      from: event.returnValues.from as string,
      to: event.returnValues.to as string,
      value: event.returnValues.value as string,
    });
  }
  return formattedEvents;
}

async function formatAndnsertlaterEvents(events: EventLog[]) {
  for (const event of events) {
    logger.info("Adding transfer to DB", {
      transactionHash: event.transactionHash,
    });
    const eventTimestamp = await getBlockTimestamp(event.blockNumber as number);
    insertTransfers([
      {
        transaction_timestamp: new Date(
          Number(eventTimestamp) * 1000,
        ).toISOString(),
        transaction_hash: event.transactionHash as string,
        block_number: event.blockNumber as number,
        from: event.returnValues.from as string,
        to: event.returnValues.to as string,
        value: event.returnValues.value as string,
      },
    ]);
  }
}

export async function fetchAndStoreTransfers(
  startBlock: number,
  endBlock: number,
) {
  const ranges = splitRange(startBlock, endBlock, 1000);
  let events: EventLog[] = [];
  let laterEvents: EventLog[] = [];
  let totalEventsFetched = 0;
  const seenHashes = new Set<string>();

  for (const range of ranges) {
    logger.info(`Fetching events`, {
      fromBlock: range.from,
      toBlock: range.to,
    });

    const rangeEvents = await fetchEventsInRange(range.from, range.to);

    const uniqueRangeEvents = rangeEvents.filter((event) => {
      if (seenHashes.has(event.transactionHash as string)) {
        return false;
      }
      seenHashes.add(event.transactionHash as string);
      return true;
    });

    events = [...events, ...uniqueRangeEvents];
    totalEventsFetched += uniqueRangeEvents.length;
    if (totalEventsFetched >= eventLimit) {
      laterEvents = events.slice(eventLimit, totalEventsFetched - 1);
      events = events.slice(0, eventLimit);
      break;
    }
  }

  logger.info(
    `Fetched ${events.length} events, ${laterEvents.length} events will be processed later`,
  );

  const formattedEvents = await formatEvents(events);
  await insertTransfers(formattedEvents);
  formatAndnsertlaterEvents(laterEvents);
}

export async function processTransfers(
  startTimestamp: string,
  endTimestamp: string,
) {
  try {
    const transfers = await getTransfersWithTimestampRange(
      startTimestamp,
      endTimestamp,
    );

    if (transfers?.length >= eventLimit) {
      logger.info("Returning existing DB data");
      return transfers.slice(0, eventLimit);
    }
    const { startBlock, endBlock } = await getBlockNumbersForRange(
      startTimestamp,
      endTimestamp,
    );
    logger.info("Block numbers for range", { startBlock, endBlock });

    const missingRanges = await getMissingBlockRanges(startBlock, endBlock);
    logger.info("Missing range to process", missingRanges);

    for (const range of missingRanges) {
      await fetchAndStoreTransfers(range.from, range.to);
    }
    return await getTransfersWithTimestampRange(startTimestamp, endTimestamp);
  } catch (error) {
    logger.error("Error fetching and storing transfers", { error });
  }
}
