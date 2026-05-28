import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ KẾT NỐI RDS THÀNH CÔNG!");
    console.log("Thời gian server:", result.rows[0]);
  } catch (err) {
    console.error("❌ LỖI KẾT NỐI:", err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
