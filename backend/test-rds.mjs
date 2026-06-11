import pg from 'pg';

const { Client } = pg;

const client = new Client({
    host: 'cloud-project-db.c96640eowb55.ap-southeast-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: '8721645Bo',
    database: 'postgres',

    ssl: {
        rejectUnauthorized: false
    }
});

async function connectDB() {

    try {

        await client.connect();

        console.log('✅ Connected AWS RDS PostgreSQL');

        const result = await client.query(
            'SELECT NOW()'
        );

        console.log(result.rows);

        await client.end();

    } catch (err) {

        console.error(err);
    }
}

connectDB();