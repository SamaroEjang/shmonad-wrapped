import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './client';

export async function runMigrations() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Migrations applied.');
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Migration rollback also failed:', rollbackErr);
      }
      throw err;
    }
  } finally {
    client.release();
  }
}
