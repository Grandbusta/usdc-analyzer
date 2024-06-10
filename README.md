# Avalanche USDC analyzer

An API to query transactions on avalanche c-chain

## Technologies Used
- NodeJS
- Typescript
- PostgreSQL
- ExpressJs
- Winston logger
- Knex query builder

## Setup
- Clone the repository
- Generate an api key on Infura
- Create a `.env` file in the root directory and check the `.env.sample` file to know the needed details.
- Run `npm install` to install the required dependencies
- Create a postgres database
- Run migrations: `npx knex --knexfile src/db/index.ts migrate:latest`

## Usage
- Run `npm run dev` to start the application on `localhost:4000`
- Make a `GET` request to the endpoint: `/transfers?startTimestamp=2023-01-01&endTimestamp=2023-01-31`
NB: startTimestamp and endTimestamp are required for this endpoint.

## Technical process and considerations

### Challenges faced and approach
1.
- Probliem: The inability to query blockchain directly with timestamps was the first issue i faced. The blockchain cannot be queried with the timestamps but can be queried with blockNumber. I needed to do a couple of data checking and manipulation in my implementation to be able to get the timestamp. Initially, i used a binary search to get this timestamps and saw that it would take approximately 26 runs to get them indicating 26 calls to the blockchain. It was very slow because i still needed to fetch the actual transaction.

- Final Approach: I used a package to make this faster so i wouldn't need to traverse the blocks from inception till current.

2.
- Problem: Batching of requests - The infura RPC endpoint can't return more than 10,000 request at once.

- Final Approach: Batched the blocks with a difference of 1000 blocks at a time. This ensured that the data received is not more than  10,000

3.
- Problem: Calling the blockchain everytime is very slow especially when i had to perform multiple request in a single endpoint call. Infura rate limiter allow less than 10 requests per seconds on the free tier.

- Final Approach: I had to run a forof loop to process it sequentially/ instead of the concurrent method i wanted to use. I used the postgresql database to store data as they are fetched from the blockchain.Apart from the restriction that only 10 transactions can be fetched at a time. I also implmented a system to store transaction within the time range but not wait for it so it doesn't block the response. This helps in pagination and ensure that request to blockchain are not being made everytime a user calls the endpoint. I tried to sync the avalanche historical data but it was much of a data that i won't finish syncing in days. Pagination has not be properly implemented because of the time but i have a solid approach to make this work if needed.