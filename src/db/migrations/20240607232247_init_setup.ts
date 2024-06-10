import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transfers", (table) => {
    table.uuid("transfer_id").defaultTo(knex.fn.uuid()).primary();
    table.timestamp("transaction_timestamp").notNullable();
    table.string("transaction_hash").notNullable().unique();
    table.integer("block_number").notNullable();
    table.string("from").notNullable();
    table.string("to").notNullable();
    table.string("value").notNullable();

    table.index([
      "transaction_timestamp",
      "transaction_hash",
      "block_number",
      "from",
      "to",
      "value",
    ]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transfers");
}
