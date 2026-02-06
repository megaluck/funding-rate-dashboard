import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.log('Slow query:', { text: text.substring(0, 100), duration, rows: res.rowCount });
  }
  return res;
}

export async function getClient() {
  return pool.connect();
}

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch {
    return false;
  }
}
