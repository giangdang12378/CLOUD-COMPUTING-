import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ RDS CONNECT SUCCESS:", result.rows[0]);
  } catch (err) {
    console.error("❌ CONNECT FAILED:", err);
  } finally {
    await pool.end();
  }
}

test();
