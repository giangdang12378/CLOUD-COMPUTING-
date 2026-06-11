import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    max: 20,
    ssl: {
        rejectUnauthorized: false
    }
});

export default pool;
