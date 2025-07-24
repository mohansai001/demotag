/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('dashboard_metrics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('metric_name').notNullable();
    table.string('metric_type').notNullable(); // 'counter', 'gauge', 'percentage'
    table.decimal('value', 15, 2).notNullable();
    table.string('unit');
    table.string('category');
    table.text('description');
    table.json('metadata'); // Additional data as JSON
    table.date('metric_date').notNullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('metric_name');
    table.index('metric_type');
    table.index('category');
    table.index('metric_date');
    table.index(['metric_name', 'metric_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('dashboard_metrics');
};