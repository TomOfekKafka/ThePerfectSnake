import { sql } from '@vercel/postgres';
import fs from 'fs/promises';

async function runMigration() {
  try {
    console.log('Running migration: add payer_first_name column...');

    const migrationSQL = await fs.readFile('sql/migration-add-payer-name.sql', 'utf-8');

    await sql.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
