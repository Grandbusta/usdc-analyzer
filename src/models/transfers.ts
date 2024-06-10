export interface Transfer {
  transaction_timestamp: string;
  transaction_hash: string;
  block_number: number;
  from: string;
  to: string;
  value: string;
}
