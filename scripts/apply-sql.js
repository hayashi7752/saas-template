/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config();

async function run() {
  const sqlFile = path.resolve(process.cwd(), 'migration.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('migration.sql not found at project root');
    process.exit(1);
  }

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DIRECT_URL or DATABASE_URL is not set in environment');
    process.exit(1);
  }

  const rawSql = fs.readFileSync(sqlFile, 'utf8');
  if (!rawSql.trim()) {
    console.error('migration.sql is empty');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
    query_timeout: 120000,
  });

  // Naive splitter: split by ';' and execute sequentially to better tolerate partial failures
  const statements = rawSql
    .split(/;\s*\n|;\s*$/gm)
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    // Ensure we are not killed by pooler settings
    await client.query("SET statement_timeout TO '120s';");
    await client.query("SET idle_in_transaction_session_timeout TO '120s';");

    console.log(`🚀 Applying ${statements.length} SQL statements from migration.sql...`);
    await client.query('BEGIN');
    for (const [idx, stmt] of statements.entries()) {
      try {
        await client.query(stmt);
        console.log(`  ✅ Statement ${idx + 1}/${statements.length} applied`);
      } catch (err) {
        const msg = String(err?.message || err);
        // Tolerate idempotent errors
        const tolerable =
          /already exists|duplicate object|duplicate key|duplicate column|type "\w+" already exists/i.test(
            msg
          );
        if (tolerable) {
          console.warn(`  ⚠️  Statement ${idx + 1} warning (ignored): ${msg}`);
          continue;
        }
        console.error(`  ❌ Statement ${idx + 1} failed: ${msg}`);
        throw err;
      }
    }
    await client.query('COMMIT');
    console.log('🎉 Migration SQL applied successfully');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('❌ Failed to apply migration.sql');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
