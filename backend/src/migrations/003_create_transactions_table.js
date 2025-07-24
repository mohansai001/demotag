/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('transaction_ref').unique().notNullable();
    table.string('description').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.string('type').notNullable(); // 'income', 'expense', 'transfer'
    table.string('category');
    table.string('status').defaultTo('pending'); // 'pending', 'completed', 'failed', 'cancelled'
    table.string('payment_method');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.json('metadata'); // Additional transaction data
    table.timestamp('transaction_date').notNullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('transaction_ref');
    table.index('type');
    table.index('status');
    table.index('category');
    table.index('user_id');
    table.index('transaction_date');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};